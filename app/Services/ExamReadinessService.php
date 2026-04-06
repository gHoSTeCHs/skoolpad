<?php

namespace App\Services;

use App\Enums\CheckInSessionStatus;
use App\Enums\ParentChildLinkStatus;
use App\Enums\SpacedRepetitionStatus;
use App\Enums\TopicCoverageStatus as TopicCoverageStatusEnum;
use App\Enums\VerificationResult;
use App\Models\ExamReadinessCache;
use App\Models\ParentCheckInSession;
use App\Models\ParentChildLink;
use App\Models\PracticeSession;
use App\Models\QuestionTopicLink;
use App\Models\ReadinessScoreHistory;
use App\Models\SchemeOfWorkItem;
use App\Models\SpacedRepetitionItem;
use App\Models\TopicCompletion;
use App\Models\TopicCoverage;
use App\Models\User;
use App\Models\VerificationAttempt;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class ExamReadinessService
{
    /** @var array<string, Collection> */
    private array $linkIdsCache = [];

    private const DEVICELESS_THRESHOLD = 3;

    private const FULL_THRESHOLD = 10;

    private const REDISTRIBUTION_MIN_TOPICS = 3;

    private const MAX_WEEKLY_DELTA = 8.0;

    private const MIN_WEEKLY_DELTA = -5.0;

    private const DECAY_RATE = 0.85;

    private const PROJECTION_HISTORY_WEEKS = 4;

    private const FULL_WEIGHTS = [
        'syllabus_coverage' => 25,
        'practice_performance' => 35,
        'spaced_retention' => 20,
        'parent_verification' => 20,
    ];

    private const DEVICELESS_WEIGHTS = [
        'parent_verification' => 60,
        'curriculum_progress' => 20,
        'verification_consistency' => 20,
    ];

    public function calculateForSubject(User $user, string $levelSubjectId): ExamReadinessCache
    {
        $sessionCount = $this->getCompletedSessionCount($user);
        $mode = $this->detectFormulaMode($sessionCount);
        $topicIds = $this->getTopicIdsForSubject($levelSubjectId);
        $parentLink = $this->getActiveParentChildLink($user);

        if ($mode === 'full') {
            $components = $this->calculateFullComponents($user, $levelSubjectId, $topicIds, $parentLink);
            $score = $this->computeWeightedScore($components, self::FULL_WEIGHTS);
        } elseif ($mode === 'deviceless') {
            $components = $this->calculateDevicelessComponents($user, $topicIds, $parentLink);
            $score = $this->computeWeightedScore($components, self::DEVICELESS_WEIGHTS);
        } else {
            $fullComponents = $this->calculateFullComponents($user, $levelSubjectId, $topicIds, $parentLink);
            $fullScore = $this->computeWeightedScore($fullComponents, self::FULL_WEIGHTS);

            $devicelessComponents = $this->calculateDevicelessComponents($user, $topicIds, $parentLink);
            $devicelessScore = $this->computeWeightedScore($devicelessComponents, self::DEVICELESS_WEIGHTS);

            $blendFactor = $this->getBlendFactor($sessionCount);
            $score = ($devicelessScore * (1 - $blendFactor)) + ($fullScore * $blendFactor);
            $components = $fullComponents;
        }

        $cache = ExamReadinessCache::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'curriculum_subject_level_id' => $levelSubjectId,
            ],
            [
                'syllabus_coverage' => $components['syllabus_coverage'] ?? 0,
                'practice_performance' => $components['practice_performance'] ?? 0,
                'spaced_retention' => $components['spaced_retention'] ?? 0,
                'parent_verification' => $components['parent_verification'] ?? 0,
                'composite_score' => round($score, 2),
                'calculated_at' => now(),
            ]
        );

        ReadinessScoreHistory::query()->create([
            'user_id' => $user->id,
            'curriculum_subject_level_id' => $levelSubjectId,
            'composite_score' => round($score, 2),
            'recorded_at' => now(),
        ]);

        return $cache;
    }

    public function recalculateAll(User $user): void
    {
        $levelSubjectIds = ExamReadinessCache::query()
            ->where('user_id', $user->id)
            ->pluck('curriculum_subject_level_id');

        foreach ($levelSubjectIds as $levelSubjectId) {
            $this->calculateForSubject($user, $levelSubjectId);
        }
    }

    public function getProjectedReadiness(User $user, string $levelSubjectId, CarbonInterface $examDate): ?float
    {
        $cached = $this->getCachedReadiness($user, $levelSubjectId);

        if (! $cached instanceof ExamReadinessCache) {
            return null;
        }

        $currentScore = (float) $cached->composite_score;
        $weeksUntilExam = max(1, (int) now()->diffInWeeks($examDate));

        $history = ReadinessScoreHistory::query()
            ->forSubject($user->id, $levelSubjectId)
            ->recent(self::PROJECTION_HISTORY_WEEKS * 7)
            ->orderBy('recorded_at')
            ->get(['composite_score', 'recorded_at']);

        if ($history->count() >= 2) {
            return $this->projectFromHistory($history, $currentScore, $weeksUntilExam);
        }

        return $this->projectWithDecayCurve($currentScore, $weeksUntilExam);
    }

    /** @return array<int, array{date: string, score: float}> */
    public function getExamReadinessTrend(User $user, string $levelSubjectId, int $days = 28): array
    {
        return ReadinessScoreHistory::query()
            ->forSubject($user->id, $levelSubjectId)
            ->recent($days)
            ->orderBy('recorded_at')
            ->get(['composite_score', 'recorded_at'])
            ->map(fn (ReadinessScoreHistory $row) => [
                'date' => $row->recorded_at->toDateString(),
                'score' => (float) $row->composite_score,
            ])
            ->values()
            ->all();
    }

    /** @return Collection<int, ExamReadinessCache>|ExamReadinessCache|null */
    public function getCachedReadiness(User $user, ?string $levelSubjectId = null): Collection|ExamReadinessCache|null
    {
        if ($levelSubjectId) {
            return ExamReadinessCache::query()
                ->where('user_id', $user->id)
                ->where('curriculum_subject_level_id', $levelSubjectId)
                ->first();
        }

        return ExamReadinessCache::query()
            ->where('user_id', $user->id)
            ->get();
    }

    private function projectFromHistory(Collection $history, float $currentScore, int $weeksUntilExam): float
    {
        $first = $history->first();
        $last = $history->last();
        $weeksCovered = max(1, (int) $first->recorded_at->diffInWeeks($last->recorded_at));

        $weeklyDelta = ((float) $last->composite_score - (float) $first->composite_score) / $weeksCovered;
        $weeklyDelta = min(self::MAX_WEEKLY_DELTA, max(self::MIN_WEEKLY_DELTA, $weeklyDelta));

        $projected = $currentScore + ($weeklyDelta * $weeksUntilExam);

        return round(min(100, max(0, $projected)), 2);
    }

    private function projectWithDecayCurve(float $currentScore, int $weeksUntilExam): float
    {
        $gap = 100 - $currentScore;
        $projectedGap = $gap * pow(self::DECAY_RATE, $weeksUntilExam);

        return round(100 - $projectedGap, 2);
    }

    private function getCompletedSessionCount(User $user): int
    {
        return PracticeSession::query()
            ->where('user_id', $user->id)
            ->whereNotNull('completed_at')
            ->count();
    }

    private function detectFormulaMode(int $sessionCount): string
    {
        if ($sessionCount < self::DEVICELESS_THRESHOLD) {
            return 'deviceless';
        }

        if ($sessionCount >= self::FULL_THRESHOLD) {
            return 'full';
        }

        return 'blend';
    }

    private function getBlendFactor(int $sessionCount): float
    {
        return ($sessionCount - self::DEVICELESS_THRESHOLD) / (self::FULL_THRESHOLD - self::DEVICELESS_THRESHOLD);
    }

    /** @return array{syllabus_coverage: float, practice_performance: float, spaced_retention: float, parent_verification: float} */
    private function calculateFullComponents(User $user, string $levelSubjectId, Collection $topicIds, ?ParentChildLink $parentLink): array
    {
        $pvResult = $this->calculateParentVerification($user, $topicIds, 'full', $parentLink);

        return [
            'syllabus_coverage' => $this->calculateSyllabusCoverage($user, $topicIds),
            'practice_performance' => $this->calculatePracticePerformance($user, $levelSubjectId),
            'spaced_retention' => $this->calculateSpacedRetention($user, $topicIds),
            'parent_verification' => $pvResult['score'],
            '_eligible_topic_count' => $pvResult['eligible_topic_count'],
        ];
    }

    /** @return array{parent_verification: float, curriculum_progress: float, verification_consistency: float, _eligible_topic_count: int} */
    private function calculateDevicelessComponents(User $user, Collection $topicIds, ?ParentChildLink $parentLink): array
    {
        $pvResult = $this->calculateParentVerification($user, $topicIds, 'deviceless', $parentLink);

        return [
            'parent_verification' => $pvResult['score'],
            'curriculum_progress' => $this->calculateCurriculumProgress($topicIds, $parentLink),
            'verification_consistency' => $this->calculateVerificationConsistency($parentLink),
            '_eligible_topic_count' => $pvResult['eligible_topic_count'],
        ];
    }

    private function computeWeightedScore(array $components, array $weights): float
    {
        $pvWeight = $weights['parent_verification'] ?? 0;
        $eligibleCount = $components['_eligible_topic_count'] ?? self::REDISTRIBUTION_MIN_TOPICS;

        if ($eligibleCount < self::REDISTRIBUTION_MIN_TOPICS && $pvWeight > 0) {
            $otherWeights = array_filter($weights, fn ($k) => $k !== 'parent_verification', ARRAY_FILTER_USE_KEY);
            $totalOther = array_sum($otherWeights);

            if ($totalOther > 0) {
                $redistributed = [];
                foreach ($otherWeights as $key => $w) {
                    $redistributed[$key] = $w + ($pvWeight * $w / $totalOther);
                }

                $score = 0;
                foreach ($redistributed as $key => $w) {
                    $score += ($components[$key] ?? 0) * $w / 100;
                }

                return round($score, 2);
            }
        }

        $score = 0;
        foreach ($weights as $key => $w) {
            $score += ($components[$key] ?? 0) * $w / 100;
        }

        return round($score, 2);
    }

    private function calculateSyllabusCoverage(User $user, Collection $topicIds): float
    {
        if ($topicIds->isEmpty()) {
            return 0;
        }

        $completedTopicIds = TopicCompletion::query()
            ->where('user_id', $user->id)
            ->whereIn('canonical_topic_id', $topicIds)
            ->pluck('canonical_topic_id');

        $verifiedTopicIds = $this->getParentVerifiedTopicIds($user, $topicIds);

        $coveredCount = $completedTopicIds->merge($verifiedTopicIds)->unique()->count();

        return min(100, round(($coveredCount / $topicIds->count()) * 100, 2));
    }

    private function calculatePracticePerformance(User $user, string $levelSubjectId): float
    {
        $avg = PracticeSession::query()
            ->where('user_id', $user->id)
            ->where('level_subject_id', $levelSubjectId)
            ->whereNotNull('completed_at')
            ->whereNotNull('score_percentage')
            ->avg('score_percentage');

        return round((float) $avg, 2);
    }

    private function calculateSpacedRetention(User $user, Collection $topicIds): float
    {
        if ($topicIds->isEmpty()) {
            return 0;
        }

        $questionIds = QuestionTopicLink::query()
            ->whereIn('canonical_topic_id', $topicIds)
            ->pluck('question_id');

        if ($questionIds->isEmpty()) {
            return 0;
        }

        $graduated = SpacedRepetitionItem::query()
            ->where('user_id', $user->id)
            ->whereIn('question_id', $questionIds)
            ->where('status', SpacedRepetitionStatus::Graduated)
            ->count();

        $active = SpacedRepetitionItem::query()
            ->where('user_id', $user->id)
            ->whereIn('question_id', $questionIds)
            ->where('status', SpacedRepetitionStatus::Active)
            ->count();

        $total = $graduated + $active;

        if ($total === 0) {
            return 0;
        }

        return round(($graduated / $total) * 100, 2);
    }

    /** @return array{score: float, eligible_topic_count: int} */
    private function calculateParentVerification(User $user, Collection $topicIds, string $mode, ?ParentChildLink $parentLink): array
    {
        if ($topicIds->isEmpty()) {
            return ['score' => 0, 'eligible_topic_count' => 0];
        }

        if ($mode === 'deviceless') {
            $eligibleTopicIds = $parentLink
                ? TopicCoverage::query()
                    ->where('parent_child_link_id', $parentLink->id)
                    ->where('status', TopicCoverageStatusEnum::Covered)
                    ->whereIn('canonical_topic_id', $topicIds)
                    ->pluck('canonical_topic_id')
                : collect();
        } else {
            $eligibleTopicIds = $topicIds;
        }

        if ($eligibleTopicIds->isEmpty()) {
            return ['score' => 0, 'eligible_topic_count' => 0];
        }

        $understoodCount = $this->getParentVerifiedTopicIds($user, $eligibleTopicIds)->count();

        return [
            'score' => round(($understoodCount / $eligibleTopicIds->count()) * 100, 2),
            'eligible_topic_count' => $eligibleTopicIds->count(),
        ];
    }

    private function calculateCurriculumProgress(Collection $topicIds, ?ParentChildLink $parentLink): float
    {
        if (! $parentLink || ! $parentLink->current_term || ! $parentLink->term_start_date) {
            return 0;
        }

        $currentWeek = $this->getCurrentSchemeWeek($parentLink);

        $expectedCount = SchemeOfWorkItem::query()
            ->whereIn('canonical_topic_id', $topicIds)
            ->where('term', $parentLink->current_term->toInt())
            ->where('week_number', '<=', $currentWeek)
            ->count();

        if ($expectedCount === 0) {
            return 0;
        }

        $coveredCount = TopicCoverage::query()
            ->where('parent_child_link_id', $parentLink->id)
            ->where('status', TopicCoverageStatusEnum::Covered)
            ->whereIn('canonical_topic_id', $topicIds)
            ->count();

        return min(100, round(($coveredCount / $expectedCount) * 100, 2));
    }

    private function calculateVerificationConsistency(?ParentChildLink $parentLink): float
    {
        if (! $parentLink) {
            return 0;
        }

        $thirtyDaysAgo = now()->subDays(30)->toDateString();

        $checkInDays = ParentCheckInSession::query()
            ->where('parent_child_link_id', $parentLink->id)
            ->where('status', CheckInSessionStatus::Completed)
            ->where('session_date', '>=', $thirtyDaysAgo)
            ->distinct('session_date')
            ->count('session_date');

        return min(100, round(($checkInDays / 30) * 100, 2));
    }

    private function getTopicIdsForSubject(string $levelSubjectId): Collection
    {
        return SchemeOfWorkItem::query()
            ->where('curriculum_subject_level_id', $levelSubjectId)
            ->whereNotNull('canonical_topic_id')
            ->pluck('canonical_topic_id')
            ->unique();
    }

    private function getParentLinkIds(User $user): Collection
    {
        return $this->linkIdsCache[$user->id] ??= ParentChildLink::query()
            ->whereHas('studentProfile', fn ($q) => $q->where('user_id', $user->id))
            ->where('status', ParentChildLinkStatus::Active)
            ->pluck('id');
    }

    private function getParentVerifiedTopicIds(User $user, Collection $topicIds): Collection
    {
        $linkIds = $this->getParentLinkIds($user);

        if ($linkIds->isEmpty()) {
            return collect();
        }

        return VerificationAttempt::query()
            ->whereIn('parent_child_link_id', $linkIds)
            ->whereIn('canonical_topic_id', $topicIds)
            ->where('overall_result', VerificationResult::Understood)
            ->pluck('canonical_topic_id')
            ->unique();
    }

    private function getActiveParentChildLink(User $user): ?ParentChildLink
    {
        return ParentChildLink::query()
            ->whereHas('studentProfile', fn ($q) => $q->where('user_id', $user->id))
            ->where('status', ParentChildLinkStatus::Active)
            ->first();
    }

    private function getCurrentSchemeWeek(ParentChildLink $link): int
    {
        if (! $link->term_start_date) {
            return 1;
        }

        $daysDiff = $link->term_start_date->diffInDays(now());

        return (int) floor($daysDiff / 7) + 1;
    }
}
