<?php

namespace App\Services;

use App\Enums\PracticeMode;
use App\Models\AssessmentType;
use App\Models\CourseTopicMapping;
use App\Models\ExamGoal;
use App\Models\InstitutionCourse;
use App\Models\PracticeAnswer;
use App\Models\PracticeSession;
use App\Models\Question;
use App\Models\QuestionPaper;
use App\Models\User;
use Illuminate\Support\Collection;

class ExamPrepService
{
    public function getActiveGoals(User $user): Collection
    {
        return ExamGoal::query()
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->with(['assessmentType.gradingScale', 'institutionCourse'])
            ->get();
    }

    public function getAvailablePapers(AssessmentType $type, ?InstitutionCourse $course = null): Collection
    {
        return QuestionPaper::query()
            ->where('assessment_type_id', $type->id)
            ->published()
            ->when($course, fn ($q) => $q->where('institution_course_id', $course->id))
            ->withCount('questions')
            ->get();
    }

    public function createMockSession(User $user, QuestionPaper $paper): PracticeSession
    {
        $questions = Question::query()
            ->where('question_paper_id', $paper->id)
            ->orderBy('question_section_id')
            ->orderBy('sort_order')
            ->get();

        return PracticeSession::create([
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

    public function getTopicGaps(User $user, ExamGoal $goal): Collection
    {
        if (! $goal->institution_course_id) {
            return collect();
        }

        $mappings = CourseTopicMapping::query()
            ->where('institution_course_id', $goal->institution_course_id)
            ->with('topic:id,title')
            ->orderBy('sequence_order')
            ->get();

        return $this->buildTopicAccuracy($user, $mappings)
            ->filter(fn ($t) => $t['accuracy'] < 70 || $t['total'] === 0)
            ->sortBy('accuracy')
            ->values();
    }

    /** @return array<string, mixed>|null */
    public function getDailyPlan(User $user, ExamGoal $goal): ?array
    {
        if (! $goal->exam_date) {
            return null;
        }

        if (! $goal->institution_course_id) {
            return null;
        }

        $daysRemaining = max(1, (int) now()->startOfDay()->diffInDays($goal->exam_date));

        $mappings = CourseTopicMapping::query()
            ->where('institution_course_id', $goal->institution_course_id)
            ->with('topic:id,title')
            ->orderBy('sequence_order')
            ->get();

        $topicStats = $this->buildTopicAccuracy($user, $mappings, true);

        $remaining = $topicStats->filter(fn ($t) => $t['accuracy'] < 70 || $t['total'] === 0);

        $sorted = $remaining->sortBy([
            fn ($a, $b) => $this->weaknessScore($a) <=> $this->weaknessScore($b),
            fn ($a, $b) => $this->weightScore($b['weight']) <=> $this->weightScore($a['weight']),
        ])->values();

        $topicsPerDay = (int) ceil($sorted->count() / $daysRemaining);
        $todayTopics = $sorted->take($topicsPerDay)->values();

        $todayTopicIds = $todayTopics->pluck('topic_id')->toArray();
        $suggestedQuestionCount = 0;

        if (! empty($todayTopicIds)) {
            $suggestedQuestionCount = min(20, Question::query()
                ->where('institution_course_id', $goal->institution_course_id)
                ->whereHas('topicLinks', fn ($q) => $q->whereIn('canonical_topic_id', $todayTopicIds))
                ->count());
        }

        return [
            'days_remaining' => $daysRemaining,
            'topics_remaining' => $sorted->count(),
            'topics_per_day' => $topicsPerDay,
            'today_topics' => $todayTopics->map(fn ($t) => [
                'id' => $t['topic_id'],
                'title' => $t['title'],
                'accuracy' => $t['accuracy'],
                'weight' => $t['weight'],
            ])->toArray(),
            'suggested_question_count' => $suggestedQuestionCount,
            'suggested_time_minutes' => $todayTopics->count() * 10,
        ];
    }

    private function buildTopicAccuracy(User $user, Collection $mappings, bool $includeWeight = false): Collection
    {
        $topicIds = $mappings->pluck('canonical_topic_id')->toArray();

        if (empty($topicIds)) {
            return collect();
        }

        $answerStats = PracticeAnswer::query()
            ->whereHas('practiceSession', fn ($q) => $q->where('user_id', $user->id))
            ->whereHas('question.topicLinks', fn ($q) => $q->whereIn('canonical_topic_id', $topicIds))
            ->whereNotNull('is_correct')
            ->selectRaw('
                question_topic_links.canonical_topic_id,
                count(*) as total,
                sum(case when practice_answers.is_correct = true then 1 else 0 end) as correct
            ')
            ->join('question_topic_links', 'practice_answers.question_id', '=', 'question_topic_links.question_id')
            ->whereIn('question_topic_links.canonical_topic_id', $topicIds)
            ->groupBy('question_topic_links.canonical_topic_id')
            ->get()
            ->keyBy('canonical_topic_id');

        return $mappings->map(function ($mapping) use ($answerStats, $includeWeight) {
            $stats = $answerStats->get($mapping->canonical_topic_id);
            $total = $stats ? (int) $stats->total : 0;
            $correct = $stats ? (int) $stats->correct : 0;
            $accuracy = $total > 0 ? round(($correct / $total) * 100, 1) : 0;

            $result = [
                'topic_id' => $mapping->canonical_topic_id,
                'topic_title' => $mapping->topic->title ?? 'Unknown',
                'title' => $mapping->topic->title ?? 'Unknown',
                'correct' => $correct,
                'total' => $total,
                'accuracy' => $accuracy,
            ];

            if ($includeWeight) {
                $result['weight'] = $mapping->weight?->value ?? 'core';
            }

            return $result;
        });
    }

    private function weaknessScore(array $topic): int
    {
        if ($topic['total'] === 0) {
            return 1;
        }

        if ($topic['accuracy'] < 70) {
            return 0;
        }

        return 2;
    }

    private function weightScore(string $weight): int
    {
        return match ($weight) {
            'core' => 3,
            'supplementary' => 2,
            'optional' => 1,
            default => 0,
        };
    }
}
