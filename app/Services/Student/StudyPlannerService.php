<?php

namespace App\Services\Student;

use App\Enums\PracticeMode;
use App\Models\BlockCompletion;
use App\Models\ContentBlock;
use App\Models\CourseTopicMapping;
use App\Models\ExamTimetableEntry;
use App\Models\PracticeAnswer;
use App\Models\PracticeSession;
use App\Models\Question;
use App\Models\QuestionPaper;
use App\Models\SchemeOfWorkItem;
use App\Models\StudentProfile;
use App\Models\User;
use App\Services\SpacedRepetitionService;
use Illuminate\Support\Collection;

class StudyPlannerService
{
    private const SPACED_REP_MINUTES = 2;

    private const DEFAULT_DAILY_GOAL = 30;

    private const MAX_DAILY_MINUTES = 180;

    private const IMMINENT_MULTIPLIER = 2.5;

    private const UPCOMING_MULTIPLIER = 1.5;

    private const IMMINENT_DAYS = 2;

    private const UPCOMING_DAYS = 7;

    private const WEAK_THRESHOLD = 0.6;

    private const DEVELOPING_THRESHOLD = 0.8;

    private const DEFAULT_READ_MINUTES = 10;

    private const AOC_ALLOCATION = 0.8;

    public function __construct(private SpacedRepetitionService $spacedRepService) {}

    /** @return array{total_minutes: int, baseline_minutes: int, reason: string, items: array<int, array<string, mixed>>, exam_breakdown: array<int, array<string, mixed>>}|null */
    public function buildDailyPlan(User $user, StudentProfile $profile): ?array
    {
        $entries = $user->examTimetableEntries()
            ->active()
            ->orderedByDate()
            ->with(['institutionCourse', 'levelSubject.curriculumSubject', 'aocTopics'])
            ->get();

        if ($entries->isEmpty()) {
            return null;
        }

        $budget = $this->getAdaptiveTimeBudget($profile, $entries);
        $totalMinutes = $budget['total_minutes'];
        $remainingBudget = $totalMinutes;
        $items = collect();

        $spacedRepItems = $this->getSpacedRepItems($user);
        foreach ($spacedRepItems as $srItem) {
            if ($remainingBudget <= 0) {
                break;
            }
            $items->push($srItem);
            $remainingBudget -= $srItem['estimated_minutes'];
        }

        if ($remainingBudget <= 0) {
            return [
                'total_minutes' => $totalMinutes,
                'baseline_minutes' => $budget['baseline_minutes'],
                'reason' => $budget['reason'],
                'items' => $items->values()->all(),
                'exam_breakdown' => [],
            ];
        }

        $urgencyScores = $this->calculateUrgencyScores($entries);
        $examBreakdown = [];

        foreach ($entries as $entry) {
            $entryMinutes = (int) round($remainingBudget * $urgencyScores[$entry->id]);
            if ($entryMinutes <= 0) {
                continue;
            }

            $topics = $this->resolveTopicsForEntry($entry);
            if ($topics->isEmpty()) {
                $examBreakdown[] = [
                    'entry_id' => $entry->id,
                    'subject_name' => $entry->subject_name ?? $entry->label,
                    'days_remaining' => $entry->days_remaining,
                    'allocated_minutes' => 0,
                    'weak_topic_count' => 0,
                    'ready_topic_count' => 0,
                ];

                continue;
            }

            $topicIds = $topics->pluck('topic_id')->toArray();
            $readiness = $this->buildTopicReadiness($user, $topicIds);
            $aocTopicIds = $entry->aocTopics->pluck('id')->toArray();

            $entryItems = $this->allocateItemsForEntry(
                $entry,
                $topics,
                $readiness,
                $aocTopicIds,
                $entryMinutes
            );

            foreach ($entryItems as $item) {
                $items->push($item);
            }

            $weakCount = $readiness->filter(fn ($r) => in_array($r['status'], ['not_started', 'weak', 'read_only']))->count();
            $readyCount = $readiness->filter(fn ($r) => in_array($r['status'], ['strong', 'developing']))->count();

            $examBreakdown[] = [
                'entry_id' => $entry->id,
                'subject_name' => $entry->subject_name ?? $entry->label,
                'days_remaining' => $entry->days_remaining,
                'allocated_minutes' => $entryMinutes,
                'weak_topic_count' => $weakCount,
                'ready_topic_count' => $readyCount,
            ];
        }

        return [
            'total_minutes' => $totalMinutes,
            'baseline_minutes' => $budget['baseline_minutes'],
            'reason' => $budget['reason'],
            'items' => $items->values()->all(),
            'exam_breakdown' => $examBreakdown,
        ];
    }

    /** @return array<int, array{topic_id: string, topic_title: string, status: string, accuracy: float, attempts: int, is_read: bool, is_aoc: bool}> */
    public function getTopicReadiness(User $user, ExamTimetableEntry $entry): array
    {
        $entry->loadMissing(['aocTopics']);
        $topics = $this->resolveTopicsForEntry($entry);

        if ($topics->isEmpty()) {
            return [];
        }

        $topicIds = $topics->pluck('topic_id')->toArray();
        $readiness = $this->buildTopicReadiness($user, $topicIds);
        $aocTopicIds = $entry->aocTopics->pluck('id')->toArray();

        return $topics->map(function ($topic) use ($readiness, $aocTopicIds) {
            $r = $readiness->get($topic['topic_id']);
            $accuracy = $r ? $r['accuracy'] : 0.0;
            $attempts = $r ? $r['attempts'] : 0;
            $isRead = $r ? $r['is_read'] : false;

            return [
                'topic_id' => $topic['topic_id'],
                'topic_title' => $topic['topic_title'],
                'status' => $this->classifyReadiness($accuracy, $attempts, $isRead),
                'accuracy' => round($accuracy, 2),
                'attempts' => $attempts,
                'is_read' => $isRead,
                'is_aoc' => in_array($topic['topic_id'], $aocTopicIds),
            ];
        })->values()->all();
    }

    /** @return array{total_minutes: int, baseline_minutes: int, reason: string} */
    public function getAdaptiveTimeBudget(StudentProfile $profile, Collection $entries): array
    {
        $baseline = $profile->study_preferences['daily_goal_minutes'] ?? self::DEFAULT_DAILY_GOAL;
        $minDaysRemaining = $entries->min(fn ($e) => $e->days_remaining);
        $nearestEntry = $entries->sortBy(fn ($e) => $e->days_remaining)->first();
        $nearestLabel = $nearestEntry?->subject_name ?? $nearestEntry?->label ?? 'Exam';

        if ($minDaysRemaining <= self::IMMINENT_DAYS) {
            $total = min((int) round($baseline * self::IMMINENT_MULTIPLIER), self::MAX_DAILY_MINUTES);

            return [
                'total_minutes' => $total,
                'baseline_minutes' => $baseline,
                'reason' => "{$nearestLabel} in {$minDaysRemaining} day(s) — intensive mode",
            ];
        }

        if ($minDaysRemaining <= self::UPCOMING_DAYS) {
            $total = min((int) round($baseline * self::UPCOMING_MULTIPLIER), self::MAX_DAILY_MINUTES);

            return [
                'total_minutes' => $total,
                'baseline_minutes' => $baseline,
                'reason' => "{$nearestLabel} in {$minDaysRemaining} day(s) — ramping up",
            ];
        }

        return [
            'total_minutes' => $baseline,
            'baseline_minutes' => $baseline,
            'reason' => 'Standard study pace',
        ];
    }

    public function getAvailablePapers(ExamTimetableEntry $entry): Collection
    {
        if (! $entry->assessment_type_id) {
            return collect();
        }

        return QuestionPaper::query()
            ->where('assessment_type_id', $entry->assessment_type_id)
            ->published()
            ->when($entry->institution_course_id, fn ($q) => $q->where('institution_course_id', $entry->institution_course_id))
            ->withCount('questions')
            ->get();
    }

    public function createMockSession(User $user, ExamTimetableEntry $entry, QuestionPaper $paper): PracticeSession
    {
        $questions = Question::query()
            ->where('question_paper_id', $paper->id)
            ->published()
            ->orderBy('question_section_id')
            ->orderBy('sort_order')
            ->get();

        return PracticeSession::query()->create([
            'user_id' => $user->id,
            'mode' => PracticeMode::FullMock,
            'question_paper_id' => $paper->id,
            'assessment_type_id' => $paper->assessment_type_id,
            'institution_course_id' => $paper->institution_course_id,
            'time_limit_seconds' => $paper->duration_minutes ? $paper->duration_minutes * 60 : null,
            'question_ids' => $questions->pluck('id')->values()->toArray(),
            'question_count' => $questions->count(),
            'correct_count' => 0,
            'is_resumable' => true,
            'last_activity_at' => now(),
        ]);
    }

    /** @return array<string, mixed>|null */
    public function getPredictiveScore(PracticeSession $session): ?array
    {
        if (! $session->assessment_type_id) {
            return null;
        }

        if (! $session->relationLoaded('assessmentType')) {
            $session->load('assessmentType.gradingScale');
        }

        $gradingScale = $session->assessmentType?->gradingScale;

        if (! $gradingScale) {
            return null;
        }

        $percentage = (float) $session->score_percentage;
        $boundaries = $gradingScale->grade_boundaries;

        $boundary = null;
        foreach ($boundaries as $b) {
            if ($percentage >= $b['min'] && $percentage <= $b['max']) {
                $boundary = $b;
                break;
            }
        }

        $nextBoundary = null;
        if ($boundary) {
            $higherBoundaries = collect($boundaries)
                ->filter(fn ($b) => $b['min'] > $boundary['min'])
                ->sortBy('min');

            $nextBoundary = $higherBoundaries->first();
        }

        return [
            'percentage' => $percentage,
            'grade' => $boundary['label'] ?? 'N/A',
            'is_passing' => $boundary['is_pass'] ?? false,
            'pass_threshold' => (float) $gradingScale->pass_threshold,
            'next_grade' => $nextBoundary['label'] ?? null,
            'points_to_next' => $nextBoundary ? max(0, round($nextBoundary['min'] - $percentage, 1)) : null,
        ];
    }

    /** @return array{next_exam: array{label: string, days_remaining: int, exam_date: string}|null, total_active: int, total_weak_topics: int, recommended_minutes: int, focus_topics: array<int, string>} */
    public function getExamSummary(User $user, StudentProfile $profile): array
    {
        $entries = $user->examTimetableEntries()
            ->active()
            ->orderedByDate()
            ->with(['institutionCourse', 'levelSubject.curriculumSubject', 'aocTopics'])
            ->get();

        if ($entries->isEmpty()) {
            return [
                'next_exam' => null,
                'total_active' => 0,
                'total_weak_topics' => 0,
                'recommended_minutes' => 0,
                'focus_topics' => [],
            ];
        }

        $nearest = $entries->first();
        $totalWeakTopics = 0;

        foreach ($entries as $entry) {
            $topics = $this->resolveTopicsForEntry($entry);
            if ($topics->isEmpty()) {
                continue;
            }

            $topicIds = $topics->pluck('topic_id')->toArray();
            $readiness = $this->buildTopicReadiness($user, $topicIds);
            $totalWeakTopics += $readiness->filter(fn ($r) => in_array($r['status'], ['not_started', 'weak', 'read_only']))->count();
        }

        $focusTopics = [];
        $nearestAocTopics = $nearest->aocTopics;

        if ($nearestAocTopics->isNotEmpty()) {
            $focusTopics = $nearestAocTopics->pluck('title')->take(3)->values()->all();
        } else {
            $nearestTopics = $this->resolveTopicsForEntry($nearest);
            if ($nearestTopics->isNotEmpty()) {
                $nearestTopicIds = $nearestTopics->pluck('topic_id')->toArray();
                $nearestReadiness = $this->buildTopicReadiness($user, $nearestTopicIds);

                $focusTopics = $nearestTopics
                    ->map(fn ($t) => [
                        'title' => $t['topic_title'],
                        'status' => $nearestReadiness->get($t['topic_id'])['status'] ?? 'not_started',
                    ])
                    ->filter(fn ($t) => in_array($t['status'], ['not_started', 'weak', 'read_only']))
                    ->sortBy(fn ($t) => $this->statusSortPriority($t['status']))
                    ->pluck('title')
                    ->take(3)
                    ->values()
                    ->all();
            }
        }

        $budget = $this->getAdaptiveTimeBudget($profile, $entries);

        return [
            'next_exam' => [
                'label' => $nearest->subject_name ?? $nearest->label,
                'days_remaining' => $nearest->days_remaining,
                'exam_date' => $nearest->exam_date->toISOString(),
            ],
            'total_active' => $entries->count(),
            'total_weak_topics' => $totalWeakTopics,
            'recommended_minutes' => $budget['total_minutes'],
            'focus_topics' => $focusTopics,
        ];
    }

    private function resolveTopicsForEntry(ExamTimetableEntry $entry): Collection
    {
        if ($entry->institution_course_id) {
            return CourseTopicMapping::query()
                ->where('institution_course_id', $entry->institution_course_id)
                ->with('topic:id,title')
                ->orderBy('sequence_order')
                ->get()
                ->filter(fn ($m) => $m->topic !== null)
                ->map(fn ($m) => [
                    'topic_id' => $m->canonical_topic_id,
                    'topic_title' => $m->topic->title,
                ])
                ->unique('topic_id');
        }

        if ($entry->level_subject_id) {
            return SchemeOfWorkItem::query()
                ->where('curriculum_subject_level_id', $entry->level_subject_id)
                ->whereNotNull('canonical_topic_id')
                ->with('canonicalTopic:id,title')
                ->get()
                ->filter(fn ($s) => $s->canonicalTopic !== null)
                ->map(fn ($s) => [
                    'topic_id' => $s->canonical_topic_id,
                    'topic_title' => $s->canonicalTopic->title,
                ])
                ->unique('topic_id');
        }

        return collect();
    }

    /** @return Collection<string, array{accuracy: float, attempts: int, is_read: bool, first_unread_block_id: string|null, status: string}> */
    private function buildTopicReadiness(User $user, array $topicIds): Collection
    {
        if (empty($topicIds)) {
            return collect();
        }

        $answerStats = PracticeAnswer::query()
            ->join('practice_sessions', 'practice_answers.practice_session_id', '=', 'practice_sessions.id')
            ->join('question_topic_links', 'practice_answers.question_id', '=', 'question_topic_links.question_id')
            ->where('practice_sessions.user_id', $user->id)
            ->whereNotNull('practice_answers.is_correct')
            ->whereIn('question_topic_links.canonical_topic_id', $topicIds)
            ->groupBy('question_topic_links.canonical_topic_id')
            ->selectRaw('question_topic_links.canonical_topic_id as topic_id, COUNT(*) as attempts, AVG(CASE WHEN practice_answers.is_correct THEN 1.0 ELSE 0.0 END) as accuracy')
            ->get()
            ->keyBy('topic_id');

        $blocksByTopic = ContentBlock::query()
            ->whereIn('canonical_topic_id', $topicIds)
            ->where('is_published', true)
            ->where('is_container', false)
            ->select('id', 'canonical_topic_id')
            ->orderBy('sort_order')
            ->get()
            ->groupBy('canonical_topic_id');

        $relevantBlockIds = $blocksByTopic->flatten()->pluck('id')->toArray();

        $completedBlockIds = ! empty($relevantBlockIds)
            ? BlockCompletion::query()
                ->where('user_id', $user->id)
                ->whereIn('content_block_id', $relevantBlockIds)
                ->pluck('content_block_id')
                ->toArray()
            : [];

        return collect($topicIds)->mapWithKeys(function ($topicId) use ($answerStats, $completedBlockIds, $blocksByTopic) {
            $stats = $answerStats->get($topicId);
            $accuracy = $stats ? (float) $stats->accuracy : 0.0;
            $attempts = $stats ? (int) $stats->attempts : 0;

            $topicBlocks = $blocksByTopic->get($topicId, collect());
            $hasBlocks = $topicBlocks->isNotEmpty();
            $allRead = $hasBlocks && $topicBlocks->every(fn ($b) => in_array($b->id, $completedBlockIds));
            $firstUnread = $hasBlocks
                ? $topicBlocks->first(fn ($b) => ! in_array($b->id, $completedBlockIds))?->id
                : null;

            $status = $this->classifyReadiness($accuracy, $attempts, $allRead);

            return [$topicId => [
                'accuracy' => $accuracy,
                'attempts' => $attempts,
                'is_read' => $allRead,
                'first_unread_block_id' => $firstUnread,
                'status' => $status,
            ]];
        });
    }

    private function classifyReadiness(float $accuracy, int $attempts, bool $isRead): string
    {
        if ($attempts === 0 && ! $isRead) {
            return 'not_started';
        }

        if ($attempts === 0 && $isRead) {
            return 'read_only';
        }

        if ($accuracy < self::WEAK_THRESHOLD) {
            return 'weak';
        }

        if ($accuracy < self::DEVELOPING_THRESHOLD) {
            return 'developing';
        }

        return 'strong';
    }

    /** @return array<int, array<string, mixed>> */
    private function allocateItemsForEntry(
        ExamTimetableEntry $entry,
        Collection $topics,
        Collection $readiness,
        array $aocTopicIds,
        int $entryMinutes,
    ): array {
        $items = [];
        $subjectName = $entry->subject_name ?? $entry->label;
        $hasAoc = ! empty($aocTopicIds);

        $prioritized = $topics->map(function ($topic) use ($readiness, $aocTopicIds) {
            $r = $readiness->get($topic['topic_id']);
            $status = $r ? $r['status'] : 'not_started';
            $isAoc = in_array($topic['topic_id'], $aocTopicIds);

            return array_merge($topic, [
                'status' => $status,
                'is_aoc' => $isAoc,
                'sort_priority' => $this->statusSortPriority($status),
                'readiness' => $r,
            ]);
        })->filter(fn ($t) => $t['status'] !== 'strong')
            ->sortBy('sort_priority')
            ->values();

        if ($prioritized->isEmpty()) {
            return [];
        }

        if ($hasAoc) {
            $aocTopics = $prioritized->filter(fn ($t) => $t['is_aoc']);
            $nonAocTopics = $prioritized->filter(fn ($t) => ! $t['is_aoc']);

            $aocMinutes = (int) round($entryMinutes * self::AOC_ALLOCATION);
            $nonAocMinutes = $entryMinutes - $aocMinutes;

            if ($aocTopics->isEmpty()) {
                $nonAocMinutes = $entryMinutes;
            } elseif ($nonAocTopics->isEmpty()) {
                $aocMinutes = $entryMinutes;
            }

            $items = array_merge(
                $items,
                $this->generateItems($aocTopics, $aocMinutes, $entry, $subjectName, 1),
                $this->generateItems($nonAocTopics, $nonAocMinutes, $entry, $subjectName, 2)
            );
        } else {
            $items = $this->generateItems($prioritized, $entryMinutes, $entry, $subjectName, 1);
        }

        return $items;
    }

    /** @return array<int, array<string, mixed>> */
    private function generateItems(
        Collection $topics,
        int $minutesBudget,
        ExamTimetableEntry $entry,
        string $subjectName,
        int $basePriority,
    ): array {
        $items = [];
        $remaining = $minutesBudget;

        foreach ($topics as $topic) {
            if ($remaining <= 0) {
                break;
            }

            $r = $topic['readiness'];
            $status = $topic['status'];

            if (in_array($status, ['not_started', 'read_only'])) {
                $blockId = $r ? $r['first_unread_block_id'] : null;
                $minutes = min(self::DEFAULT_READ_MINUTES, $remaining);

                if (! $r || ! $r['is_read']) {
                    $items[] = [
                        'type' => 'exam_prep',
                        'priority' => $basePriority,
                        'entry_id' => $entry->id,
                        'subject_name' => $subjectName,
                        'topic_id' => $topic['topic_id'],
                        'topic_title' => $topic['topic_title'],
                        'action' => 'read',
                        'content_block_id' => $blockId,
                        'suggested_question_count' => null,
                        'estimated_minutes' => $minutes,
                    ];
                    $remaining -= $minutes;
                }

                if ($remaining > 0 && $status === 'read_only') {
                    $practiceMinutes = min(5, $remaining);
                    $items[] = [
                        'type' => 'exam_prep',
                        'priority' => $basePriority,
                        'entry_id' => $entry->id,
                        'subject_name' => $subjectName,
                        'topic_id' => $topic['topic_id'],
                        'topic_title' => $topic['topic_title'],
                        'action' => 'practice',
                        'content_block_id' => null,
                        'suggested_question_count' => 5,
                        'estimated_minutes' => $practiceMinutes,
                    ];
                    $remaining -= $practiceMinutes;
                }
            } else {
                $questionCount = $status === 'weak' ? 10 : 5;
                $minutes = min($status === 'weak' ? 10 : 5, $remaining);

                $items[] = [
                    'type' => 'exam_prep',
                    'priority' => $basePriority,
                    'entry_id' => $entry->id,
                    'subject_name' => $subjectName,
                    'topic_id' => $topic['topic_id'],
                    'topic_title' => $topic['topic_title'],
                    'action' => 'practice',
                    'content_block_id' => null,
                    'suggested_question_count' => $questionCount,
                    'estimated_minutes' => $minutes,
                ];
                $remaining -= $minutes;
            }
        }

        return $items;
    }

    /** @return array<string, float> */
    private function calculateUrgencyScores(Collection $entries): array
    {
        $scores = [];
        $total = 0.0;

        foreach ($entries as $entry) {
            $score = 1.0 / max(1, $entry->days_remaining);
            $scores[$entry->id] = $score;
            $total += $score;
        }

        if ($total > 0) {
            foreach ($scores as $id => $score) {
                $scores[$id] = $score / $total;
            }
        }

        return $scores;
    }

    private function statusSortPriority(string $status): int
    {
        return match ($status) {
            'not_started' => 0,
            'weak' => 1,
            'developing' => 2,
            'read_only' => 3,
            'strong' => 4,
            default => 5,
        };
    }

    /** @return array<int, array<string, mixed>> */
    private function getSpacedRepItems(User $user): array
    {
        $dueItems = $this->spacedRepService->getDueItems($user);
        $items = [];

        foreach ($dueItems as $item) {
            $items[] = [
                'type' => 'review',
                'priority' => 0,
                'entry_id' => null,
                'subject_name' => $item->question?->institutionCourse?->course_code ?? 'Review',
                'topic_id' => null,
                'topic_title' => 'Spaced repetition review',
                'action' => 'review',
                'content_block_id' => null,
                'suggested_question_count' => null,
                'estimated_minutes' => self::SPACED_REP_MINUTES,
            ];
        }

        return $items;
    }
}
