<?php

namespace App\Services;

use App\Models\BlockCompletion;
use App\Models\CalendarTerm;
use App\Models\ContentBlock;
use App\Models\LevelSubject;
use App\Models\SchemeOfWorkItem;
use App\Models\StudentProfile;
use App\Models\TopicCompletion;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class GuidedStudyService
{
    private const DEFAULT_DAILY_GOAL = 30;

    private const DEFAULT_READ_TIME = 10;

    private const SPACED_REP_MINUTES = 2;

    private const WEAK_TOPIC_MINUTES = 5;

    /**
     * @return array{daily_goal_minutes: int, total_estimated_minutes: int, completed_minutes: int, current_term: int, current_week: int, items: array<int, array{type: string, priority_tier: int, subject_name: string, level_subject_id: string, topic_label: string, canonical_topic_id: ?string, content_block_id: ?string, estimated_minutes: int, is_completed: bool}>}
     */
    public function buildStudyPlan(User $user, StudentProfile $profile): array
    {
        $dailyGoal = $profile->study_preferences['daily_goal_minutes'] ?? self::DEFAULT_DAILY_GOAL;
        $termWeek = $this->resolveTermAndWeek($profile);
        $levelSubjectIds = $this->getStudentLevelSubjects($profile)->pluck('id')->toArray();

        if (empty($levelSubjectIds)) {
            return [
                'daily_goal_minutes' => $dailyGoal,
                'total_estimated_minutes' => 0,
                'completed_minutes' => 0,
                'current_term' => $termWeek['term'],
                'current_week' => $termWeek['week'],
                'items' => [],
            ];
        }

        $items = collect();
        $minutesBudget = $dailyGoal;
        $completedMinutes = 0;

        $minutesBudget = $this->addSpacedRepetitionItems($items, $minutesBudget, $user);

        $minutesBudget = $this->addSchemeOfWorkItems(
            $items, $minutesBudget, $user, $levelSubjectIds, $termWeek, $completedMinutes
        );

        $minutesBudget = $this->addWeakTopics($items, $minutesBudget, $user);

        $this->addNextUnreadBlocks($items, $minutesBudget, $user, $levelSubjectIds);

        $totalMinutes = $items->sum('estimated_minutes');

        return [
            'daily_goal_minutes' => $dailyGoal,
            'total_estimated_minutes' => $totalMinutes,
            'completed_minutes' => $completedMinutes,
            'current_term' => $termWeek['term'],
            'current_week' => $termWeek['week'],
            'items' => $items->values()->all(),
        ];
    }

    /**
     * @return array{term: int, week: int}
     */
    private function resolveTermAndWeek(StudentProfile $profile): array
    {
        if ($profile->institution_id) {
            $calendarTerm = CalendarTerm::query()
                ->where('institution_id', $profile->institution_id)
                ->where('start_date', '<=', now())
                ->where('end_date', '>=', now())
                ->first();

            if ($calendarTerm) {
                $daysSinceStart = Carbon::parse($calendarTerm->start_date)->diffInDays(now());
                $week = min(max((int) ceil(($daysSinceStart + 1) / 7), 1), 13);

                return ['term' => $calendarTerm->sort_order, 'week' => $week];
            }
        }

        return $this->nigerianCalendarHeuristic();
    }

    /**
     * @return array{term: int, week: int}
     */
    private function nigerianCalendarHeuristic(): array
    {
        $today = now();
        $year = (int) $today->format('Y');

        $terms = [
            ['term' => 1, 'start' => Carbon::create($year, 9, 12), 'end' => Carbon::create($year, 12, 13)],
            ['term' => 2, 'start' => Carbon::create($year, 1, 8), 'end' => Carbon::create($year, 3, 28)],
            ['term' => 3, 'start' => Carbon::create($year, 4, 22), 'end' => Carbon::create($year, 7, 12)],
        ];

        foreach ($terms as $t) {
            if ($today->between($t['start'], $t['end'])) {
                $daysSinceStart = $t['start']->diffInDays($today);
                $week = min(max((int) ceil(($daysSinceStart + 1) / 7), 1), 13);

                return ['term' => $t['term'], 'week' => $week];
            }
        }

        if ($today->month >= 7 && $today->month <= 9 && $today->day < 12) {
            return ['term' => 3, 'week' => 13];
        }

        if ($today->month === 12 && $today->day > 13) {
            return ['term' => 1, 'week' => 13];
        }

        if ($today->month >= 3 && $today->day > 28 && $today->month < 5) {
            return ['term' => 2, 'week' => 13];
        }

        return ['term' => 2, 'week' => 1];
    }

    /**
     * @return Collection<int, LevelSubject>
     */
    private function getStudentLevelSubjects(StudentProfile $profile): Collection
    {
        return LevelSubject::query()
            ->where('education_level_id', $profile->education_level_id)
            ->when($profile->stream_id, fn ($q) => $q->where(function ($query) use ($profile) {
                $query->whereNull('stream_id')
                    ->orWhere('stream_id', $profile->stream_id);
            }))
            ->with('curriculumSubject:id,name')
            ->get();
    }

    private function addSpacedRepetitionItems(Collection $items, int $minutesBudget, User $user): int
    {
        if ($minutesBudget <= 0) {
            return 0;
        }

        $dueItems = app(SpacedRepetitionService::class)->getDueItems($user);

        foreach ($dueItems as $item) {
            if ($minutesBudget <= 0) {
                break;
            }

            $items->push([
                'type' => 'review',
                'priority_tier' => 1,
                'subject_name' => $item->question?->institutionCourse?->course_code ?? 'Review',
                'level_subject_id' => '',
                'topic_label' => 'Spaced repetition review',
                'canonical_topic_id' => null,
                'content_block_id' => null,
                'estimated_minutes' => self::SPACED_REP_MINUTES,
                'is_completed' => false,
            ]);

            $minutesBudget -= self::SPACED_REP_MINUTES;
        }

        return $minutesBudget;
    }

    /**
     * Tier 2 — Scheme of work alignment for current term/week
     *
     * @param  array<int, string>  $levelSubjectIds
     * @param  array{term: int, week: int}  $termWeek
     */
    private function addSchemeOfWorkItems(
        Collection $items,
        int $minutesBudget,
        User $user,
        array $levelSubjectIds,
        array $termWeek,
        int &$completedMinutes,
    ): int {
        if ($minutesBudget <= 0) {
            return 0;
        }

        $schemeItems = SchemeOfWorkItem::query()
            ->whereIn('curriculum_subject_level_id', $levelSubjectIds)
            ->where('term', $termWeek['term'])
            ->where('week_number', $termWeek['week'])
            ->with([
                'canonicalTopic:id,title',
                'contentBlock:id,title,estimated_read_time',
                'levelSubject.curriculumSubject:id,name',
            ])
            ->get();

        $completedTopicIds = TopicCompletion::where('user_id', $user->id)
            ->whereIn('canonical_topic_id', $schemeItems->pluck('canonical_topic_id')->filter())
            ->pluck('canonical_topic_id')
            ->toArray();

        $completedBlockIds = BlockCompletion::where('user_id', $user->id)
            ->whereIn('content_block_id', $schemeItems->pluck('content_block_id')->filter())
            ->pluck('content_block_id')
            ->toArray();

        foreach ($schemeItems as $item) {
            if ($minutesBudget <= 0) {
                break;
            }

            $estimatedMinutes = $item->contentBlock?->estimated_read_time ?? self::DEFAULT_READ_TIME;

            if ($item->canonical_topic_id && in_array($item->canonical_topic_id, $completedTopicIds)) {
                $completedMinutes += $estimatedMinutes;

                continue;
            }

            if ($item->content_block_id && in_array($item->content_block_id, $completedBlockIds)) {
                $completedMinutes += $estimatedMinutes;

                continue;
            }

            $items->push([
                'type' => 'study',
                'priority_tier' => 2,
                'subject_name' => $item->levelSubject?->curriculumSubject?->name ?? 'Unknown',
                'level_subject_id' => $item->curriculum_subject_level_id,
                'topic_label' => $item->topic_label,
                'canonical_topic_id' => $item->canonical_topic_id,
                'content_block_id' => $item->content_block_id,
                'estimated_minutes' => $estimatedMinutes,
                'is_completed' => false,
            ]);

            $minutesBudget -= $estimatedMinutes;
        }

        return $minutesBudget;
    }

    private function addWeakTopics(Collection $items, int $minutesBudget, User $user): int
    {
        if ($minutesBudget <= 0) {
            return 0;
        }

        $weakTopics = DB::table('practice_answers')
            ->join('practice_sessions', 'practice_answers.practice_session_id', '=', 'practice_sessions.id')
            ->join('question_topic_links', 'practice_answers.question_id', '=', 'question_topic_links.question_id')
            ->join('canonical_topics', 'question_topic_links.canonical_topic_id', '=', 'canonical_topics.id')
            ->where('practice_sessions.user_id', $user->id)
            ->whereNotNull('practice_answers.is_correct')
            ->groupBy('canonical_topics.id', 'canonical_topics.title')
            ->havingRaw('COUNT(*) >= 5')
            ->havingRaw('AVG(CASE WHEN practice_answers.is_correct THEN 1.0 ELSE 0.0 END) < 0.6')
            ->select([
                'canonical_topics.id as topic_id',
                'canonical_topics.title as topic_title',
                DB::raw('COUNT(*) as attempts'),
                DB::raw('AVG(CASE WHEN practice_answers.is_correct THEN 1.0 ELSE 0.0 END) as accuracy'),
            ])
            ->orderBy('accuracy')
            ->limit(5)
            ->get();

        foreach ($weakTopics as $topic) {
            if ($minutesBudget <= 0) {
                break;
            }

            $items->push([
                'type' => 'practice',
                'priority_tier' => 3,
                'subject_name' => 'Weak Topic',
                'level_subject_id' => '',
                'topic_label' => $topic->topic_title,
                'canonical_topic_id' => $topic->topic_id,
                'content_block_id' => null,
                'estimated_minutes' => self::WEAK_TOPIC_MINUTES,
                'is_completed' => false,
            ]);

            $minutesBudget -= self::WEAK_TOPIC_MINUTES;
        }

        return $minutesBudget;
    }

    /**
     * Tier 4 — Next unread content blocks to fill remaining budget
     *
     * @param  array<int, string>  $levelSubjectIds
     */
    private function addNextUnreadBlocks(
        Collection $items,
        int $minutesBudget,
        User $user,
        array $levelSubjectIds,
    ): void {
        if ($minutesBudget <= 0) {
            return;
        }

        $topicIds = SchemeOfWorkItem::query()
            ->whereIn('curriculum_subject_level_id', $levelSubjectIds)
            ->whereNotNull('canonical_topic_id')
            ->pluck('canonical_topic_id')
            ->unique()
            ->toArray();

        if (empty($topicIds)) {
            return;
        }

        $completedBlockIds = BlockCompletion::where('user_id', $user->id)
            ->pluck('content_block_id')
            ->toArray();

        $alreadyAddedBlockIds = $items->pluck('content_block_id')->filter()->toArray();

        $blocks = ContentBlock::query()
            ->whereIn('canonical_topic_id', $topicIds)
            ->where('is_published', true)
            ->where('is_container', false)
            ->whereNotIn('id', array_merge($completedBlockIds, $alreadyAddedBlockIds))
            ->with('canonicalTopic:id,title')
            ->orderBy('sort_order')
            ->get();

        $levelSubjectMap = SchemeOfWorkItem::query()
            ->whereIn('curriculum_subject_level_id', $levelSubjectIds)
            ->whereNotNull('canonical_topic_id')
            ->with('levelSubject.curriculumSubject:id,name')
            ->get()
            ->keyBy('canonical_topic_id');

        foreach ($blocks as $block) {
            if ($minutesBudget <= 0) {
                break;
            }

            $estimatedMinutes = $block->estimated_read_time ?? self::DEFAULT_READ_TIME;
            $schemeItem = $levelSubjectMap->get($block->canonical_topic_id);

            $items->push([
                'type' => 'study',
                'priority_tier' => 4,
                'subject_name' => $schemeItem?->levelSubject?->curriculumSubject?->name ?? 'Unknown',
                'level_subject_id' => $schemeItem?->curriculum_subject_level_id ?? '',
                'topic_label' => $block->canonicalTopic?->title ?? $block->title,
                'canonical_topic_id' => $block->canonical_topic_id,
                'content_block_id' => $block->id,
                'estimated_minutes' => $estimatedMinutes,
                'is_completed' => false,
            ]);

            $minutesBudget -= $estimatedMinutes;
        }
    }
}
