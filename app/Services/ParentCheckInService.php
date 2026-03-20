<?php

namespace App\Services;

use App\Enums\CheckInSessionStatus;
use App\Enums\ParentChildLinkStatus;
use App\Enums\SpacedRepetitionStatus;
use App\Enums\TopicCoverageSource;
use App\Enums\TopicCoverageStatus;
use App\Models\CanonicalTopic;
use App\Models\LevelSubject;
use App\Models\ParentCheckInSession;
use App\Models\ParentChildLink;
use App\Models\ParentProfile;
use App\Models\SchemeOfWorkItem;
use App\Models\SpacedRepetitionItem;
use App\Models\StudentProfile;
use App\Models\TopicCoverage;
use Illuminate\Support\Collection;

class ParentCheckInService
{
    public function reportTopicCoverage(
        string $parentChildLinkId,
        string $canonicalTopicId,
        TopicCoverageStatus $status,
    ): TopicCoverage {
        return TopicCoverage::query()->updateOrCreate(
            [
                'parent_child_link_id' => $parentChildLinkId,
                'canonical_topic_id' => $canonicalTopicId,
            ],
            [
                'status' => $status,
                'covered_at' => $status === TopicCoverageStatus::Covered ? now() : null,
                'source' => TopicCoverageSource::ParentReported,
            ]
        );
    }

    /**
     * Returns 0 until scheme_of_work_items data is populated (Phase 1.8 dependency).
     * Full algorithm: compare each covered topic's scheme week_number against
     * the actual week derived from (covered_at - term_start_date) / 7, then average.
     */
    public function getSchemeOffset(string $parentChildLinkId): int
    {
        $coveredCount = TopicCoverage::query()
            ->where('parent_child_link_id', $parentChildLinkId)
            ->where('status', TopicCoverageStatus::Covered)
            ->count();

        if ($coveredCount < 5) {
            return 0;
        }

        return 0;
    }

    public function generateCheckIn(ParentChildLink $link, ?int $durationMinutes = null): ParentCheckInSession
    {
        $duration = $durationMinutes ?? $link->study_goal_minutes ?? 10;
        $profile = $link->studentProfile;
        $items = [];
        $remainingMinutes = $duration;

        $schemeItems = $this->getUncoveredSchemeTopics($link, $profile);
        foreach (array_slice($schemeItems, 0, 3) as $item) {
            if ($remainingMinutes < $item['estimated_minutes']) {
                break;
            }
            $items[] = $item;
            $remainingMinutes -= $item['estimated_minutes'];
        }

        $verificationItems = $this->getVerificationItemsForCheckIn($link);
        foreach (array_slice($verificationItems, 0, 3) as $item) {
            if ($remainingMinutes < $item['estimated_minutes']) {
                break;
            }
            $items[] = $item;
            $remainingMinutes -= $item['estimated_minutes'];
        }

        $weakItems = $this->getWeakAreaItems($link, $profile);
        foreach (array_slice($weakItems, 0, 2) as $item) {
            if ($remainingMinutes < $item['estimated_minutes']) {
                break;
            }
            $items[] = $item;
            $remainingMinutes -= $item['estimated_minutes'];
        }

        $previewItems = $this->getTopicPreviewItems($link, $profile);
        foreach (array_slice($previewItems, 0, 1) as $item) {
            if ($remainingMinutes < $item['estimated_minutes']) {
                break;
            }
            $items[] = $item;
            $remainingMinutes -= $item['estimated_minutes'];
        }

        return ParentCheckInSession::query()->create([
            'parent_child_link_id' => $link->id,
            'session_date' => now()->toDateString(),
            'duration_minutes' => $duration,
            'items' => $items,
            'completed_items' => [],
            'status' => CheckInSessionStatus::Pending,
        ]);
    }

    public function getOrCreateTonightsCheckIn(ParentChildLink $link): ParentCheckInSession
    {
        $existing = ParentCheckInSession::query()
            ->where('parent_child_link_id', $link->id)
            ->forDate(now()->toDateString())
            ->first();

        if ($existing) {
            return $existing;
        }

        return $this->generateCheckIn($link);
    }

    public function completeCheckIn(ParentCheckInSession $checkIn, array $completedItems): ParentCheckInSession
    {
        $checkIn->update([
            'completed_items' => $completedItems,
            'status' => CheckInSessionStatus::Completed,
            'completed_at' => now(),
            'started_at' => $checkIn->started_at ?? now(),
        ]);

        return $checkIn->fresh();
    }

    /** @return Collection<int, ParentCheckInSession> */
    public function getCheckInHistory(ParentChildLink $link, int $days = 30): Collection
    {
        return ParentCheckInSession::query()
            ->where('parent_child_link_id', $link->id)
            ->where('session_date', '>=', now()->subDays($days)->toDateString())
            ->orderByDesc('session_date')
            ->get();
    }

    /** @return array{topic_id: string, topic_title: string, content: ?array, verification_kit: ?array}|null */
    public function getReadTogetherContent(string $canonicalTopicId): ?array
    {
        $topic = CanonicalTopic::query()->find($canonicalTopicId);

        if (! $topic) {
            return null;
        }

        return [
            'topic_id' => $topic->id,
            'topic_title' => $topic->title,
            'content' => $topic->simplified_content ?? $topic->content,
            'verification_kit' => $topic->parent_verification_kit,
        ];
    }

    /** @return array{child_user_id: string, child_name: string, student_profile_id: string, is_secondary: bool, subjects: array, study_goal_minutes: int} */
    public function initStudyAsChildSession(ParentChildLink $link): array
    {
        $profile = $link->studentProfile;
        $childUser = $profile->user;

        $subjects = [];
        if ($profile->isSecondary() && $profile->education_level_id) {
            $subjects = LevelSubject::query()
                ->where('education_level_id', $profile->education_level_id)
                ->with('curriculumSubject:id,name')
                ->get()
                ->map(fn (LevelSubject $ls) => [
                    'id' => $ls->id,
                    'subject_name' => $ls->curriculumSubject?->name,
                ])
                ->all();
        }

        return [
            'child_user_id' => $childUser->id,
            'child_name' => $childUser->name,
            'student_profile_id' => $profile->id,
            'is_secondary' => $profile->isSecondary(),
            'subjects' => $subjects,
            'study_goal_minutes' => $link->study_goal_minutes ?? 30,
        ];
    }

    private function getUncoveredSchemeTopics(ParentChildLink $link, StudentProfile $profile): array
    {
        if (! $profile->education_level_id || ! $link->current_term || ! $link->term_start_date) {
            return [];
        }

        $currentWeek = $this->getCurrentSchemeWeek($link);

        $schemeTopicIds = SchemeOfWorkItem::query()
            ->whereHas('levelSubject', fn ($q) => $q->where('education_level_id', $profile->education_level_id))
            ->where('term', $link->current_term->toInt())
            ->where('week_number', '<=', $currentWeek)
            ->whereNotNull('canonical_topic_id')
            ->pluck('canonical_topic_id');

        if ($schemeTopicIds->isEmpty()) {
            return [];
        }

        $reportedTopicIds = TopicCoverage::query()
            ->where('parent_child_link_id', $link->id)
            ->pluck('canonical_topic_id');

        $uncoveredIds = $schemeTopicIds->diff($reportedTopicIds);

        if ($uncoveredIds->isEmpty()) {
            return [];
        }

        return CanonicalTopic::query()
            ->whereIn('id', $uncoveredIds)
            ->get()
            ->map(fn (CanonicalTopic $topic) => [
                'type' => 'scheme_alignment',
                'canonical_topic_id' => $topic->id,
                'topic_title' => $topic->title,
                'estimated_minutes' => 1,
                'week_number' => $currentWeek,
            ])
            ->all();
    }

    private function getVerificationItemsForCheckIn(ParentChildLink $link): array
    {
        /** @var ParentVerificationService $verificationService */
        $verificationService = app(ParentVerificationService::class);
        $queue = $verificationService->getVerificationQueue($link);

        return $queue->take(3)->map(fn (CanonicalTopic $topic) => [
            'type' => 'verification',
            'canonical_topic_id' => $topic->id,
            'topic_title' => $topic->title,
            'estimated_minutes' => 3,
        ])->all();
    }

    private function getWeakAreaItems(ParentChildLink $link, StudentProfile $profile): array
    {
        $childUser = $profile->user;

        $weakTopicIds = SpacedRepetitionItem::query()
            ->where('user_id', $childUser->id)
            ->where('status', SpacedRepetitionStatus::Active)
            ->where('interval_days', '<=', 1)
            ->with('question.topicLinks.canonicalTopic')
            ->get()
            ->pluck('question.topicLinks')
            ->flatten()
            ->pluck('canonical_topic_id')
            ->unique();

        if ($weakTopicIds->isEmpty()) {
            return [];
        }

        return CanonicalTopic::query()
            ->whereIn('id', $weakTopicIds)
            ->whereNotNull('parent_verification_kit')
            ->limit(2)
            ->get()
            ->map(fn (CanonicalTopic $topic) => [
                'type' => 'weak_area_review',
                'canonical_topic_id' => $topic->id,
                'topic_title' => $topic->title,
                'estimated_minutes' => 2,
            ])
            ->all();
    }

    private function getTopicPreviewItems(ParentChildLink $link, StudentProfile $profile): array
    {
        if (! $profile->education_level_id || ! $link->current_term || ! $link->term_start_date) {
            return [];
        }

        $nextWeek = $this->getCurrentSchemeWeek($link) + 1;

        $nextWeekTopicIds = SchemeOfWorkItem::query()
            ->whereHas('levelSubject', fn ($q) => $q->where('education_level_id', $profile->education_level_id))
            ->where('term', $link->current_term->toInt())
            ->where('week_number', $nextWeek)
            ->whereNotNull('canonical_topic_id')
            ->pluck('canonical_topic_id');

        if ($nextWeekTopicIds->isEmpty()) {
            return [];
        }

        return CanonicalTopic::query()
            ->whereIn('id', $nextWeekTopicIds)
            ->whereNotNull('parent_verification_kit')
            ->limit(1)
            ->get()
            ->map(fn (CanonicalTopic $topic) => [
                'type' => 'topic_preview',
                'canonical_topic_id' => $topic->id,
                'topic_title' => $topic->title,
                'estimated_minutes' => 2,
                'parent_briefing' => $topic->parent_verification_kit['parent_briefing'] ?? null,
            ])
            ->all();
    }

    private function getCurrentSchemeWeek(ParentChildLink $link): int
    {
        if (! $link->term_start_date) {
            return 1;
        }

        $daysDiff = $link->term_start_date->diffInDays(now());

        return (int) floor($daysDiff / 7) + 1;
    }

    public function getStaggeredCheckInPlan(ParentProfile $parentProfile): array
    {
        $links = $parentProfile->parentChildLinks()
            ->where('status', ParentChildLinkStatus::Active)
            ->with('studentProfile.user')
            ->get();

        if ($links->count() <= 2) {
            return $links->map(fn ($link) => [
                'link_id' => $link->id,
                'child_name' => $link->studentProfile->user->name,
                'scheduled_today' => true,
            ])->toArray();
        }

        $dayOfWeek = now()->dayOfWeek;
        $plan = [];

        foreach ($links->values() as $index => $link) {
            $schedule = match ($links->count()) {
                3 => $index === 0 ? [1, 3, 5] : ($index === 1 ? [2, 4, 6] : [1, 4, 0]),
                default => array_map(fn ($d) => ($index + $d * 2) % 7, range(0, 2)),
            };

            $plan[] = [
                'link_id' => $link->id,
                'child_name' => $link->studentProfile->user->name,
                'scheduled_today' => in_array($dayOfWeek, $schedule, true),
            ];
        }

        return $plan;
    }

    public function getQuickModeEnabled(ParentProfile $parentProfile): bool
    {
        return $parentProfile->parentChildLinks()
            ->where('status', ParentChildLinkStatus::Active)
            ->count() >= 3;
    }
}
