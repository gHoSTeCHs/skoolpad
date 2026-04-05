<?php

namespace App\Services\ParentDashboard;

use App\Enums\SpacedRepetitionStatus;
use App\Enums\TopicCoverageStatus;
use App\Enums\VerificationResult;
use App\Models\CanonicalTopic;
use App\Models\ParentChildLink;
use App\Models\PracticeAnswer;
use App\Models\QuestionTopicLink;
use App\Models\SchemeOfWorkItem;
use App\Models\SpacedRepetitionItem;
use App\Models\StudentProfile;
use App\Models\TopicCompletion;
use App\Models\TopicCoverage;
use App\Models\User;
use App\Models\VerificationAttempt;
use App\Services\Student\PracticeService;
use Illuminate\Support\Collection;

class ParentVerificationService
{
    public function __construct(
        private readonly PracticeService $practiceService,
    ) {}

    public function getVerificationQueue(ParentChildLink $link): Collection
    {
        $childUser = $link->studentProfile->user;
        $profile = $link->studentProfile;

        $appDriven = $this->getAppDrivenEligible($childUser, $profile);
        $curriculumDriven = $this->getCurriculumDrivenEligible($link, $profile);

        $alreadyUnderstoodIds = VerificationAttempt::query()
            ->where('parent_child_link_id', $link->id)
            ->where('overall_result', VerificationResult::Understood)
            ->pluck('canonical_topic_id');

        return $appDriven->concat($curriculumDriven)
            ->unique('id')
            ->reject(fn (CanonicalTopic $topic) => $alreadyUnderstoodIds->contains($topic->id))
            ->values();
    }

    /** @return array{topic_id: string, topic_title: string, parent_briefing: ?string, key_concepts: array, true_false: array, explain_prompt: ?string}|null */
    public function getVerificationKit(string $canonicalTopicId): ?array
    {
        $topic = CanonicalTopic::query()->find($canonicalTopicId);

        if (! $topic || ! $topic->parent_verification_kit) {
            return null;
        }

        $kit = $topic->parent_verification_kit;

        return [
            'topic_id' => $topic->id,
            'topic_title' => $topic->title,
            'parent_briefing' => $kit['parent_briefing'] ?? null,
            'key_concepts' => $kit['key_concepts'] ?? [],
            'true_false' => $kit['true_false'] ?? [],
            'explain_prompt' => $kit['explain_prompt'] ?? null,
        ];
    }

    /**
     * @param array{
     *     true_false?: array<int, array{statement: string, answer: bool, correct?: bool}>,
     *     explain_checklist?: array<int, array{criterion: string, checked: bool}>,
     *     mcq_answers?: array<int, array{question_id: string, selected_label: string, is_correct?: bool}>,
     * } $responses
     */
    public function submitVerification(
        ParentChildLink $link,
        string $canonicalTopicId,
        array $responses,
        VerificationResult $overallResult,
        ?string $notes = null,
    ): VerificationAttempt {
        $topic = CanonicalTopic::query()->findOrFail($canonicalTopicId);
        $responses = $this->recomputeCorrectness($topic, $responses);

        $attempt = VerificationAttempt::query()->create([
            'parent_child_link_id' => $link->id,
            'canonical_topic_id' => $canonicalTopicId,
            'responses' => $responses,
            'overall_result' => $overallResult,
            'notes' => $notes,
        ]);

        if (isset($responses['mcq_answers']) && ! empty($responses['mcq_answers'])) {
            $this->processMcqResponses(
                link: $link,
                canonicalTopicId: $canonicalTopicId,
                mcqAnswers: $responses['mcq_answers'],
                parentUser: $link->parentProfile->user,
            );
        }

        $childUser = $link->studentProfile->user;
        $this->handleSpacedRepetitionAdjustment($childUser, $canonicalTopicId, $overallResult);

        return $attempt;
    }

    /** @return array{total: int, understood: int, partially_understood: int, needs_review: int} */
    public function getVerificationStats(ParentChildLink $link): array
    {
        $base = VerificationAttempt::query()->where('parent_child_link_id', $link->id);

        return [
            'total' => (clone $base)->count(),
            'understood' => (clone $base)->where('overall_result', VerificationResult::Understood)->count(),
            'partially_understood' => (clone $base)->where('overall_result', VerificationResult::PartiallyUnderstood)->count(),
            'needs_review' => (clone $base)->where('overall_result', VerificationResult::NeedsReview)->count(),
        ];
    }

    /**
     * Validates that verification responses are consistent and not suspiciously fast.
     * IMPORTANT: Call this AFTER recomputeCorrectness() — the $responses must contain
     * server-recomputed `correct` fields, not raw client-submitted values.
     *
     * @param array{
     *     true_false?: array<int, array{statement: string, answer: bool, correct?: bool}>,
     *     explain_checklist?: array<int, array{criterion: string, checked: bool}>,
     *     mcq_answers?: array<int, array{question_id: string, selected_label: string, is_correct?: bool}>,
     * } $responses
     * @return array<int, string>
     */
    public function validateVerificationIntegrity(
        array $responses,
        VerificationResult $overallResult,
        int $timeOnScreenSeconds
    ): array {
        $warnings = [];

        $estimatedMinSeconds = count($responses['true_false'] ?? []) * 30
            + count($responses['explain_checklist'] ?? []) * 60;

        if ($estimatedMinSeconds > 0 && $timeOnScreenSeconds < max(15, (int) round($estimatedMinSeconds * 0.2))) {
            $warnings[] = 'verification_too_fast';
        }

        if ($overallResult === VerificationResult::Understood) {
            $trueFalseItems = $responses['true_false'] ?? [];
            $trueFalseTotal = count($trueFalseItems);

            if ($trueFalseTotal > 0) {
                $trueFalseCorrect = collect($trueFalseItems)
                    ->filter(fn ($item) => ($item['correct'] ?? false) === true)
                    ->count();

                if (($trueFalseCorrect / $trueFalseTotal) < 0.5) {
                    $warnings[] = 'result_mismatch';
                }
            }
        }

        return $warnings;
    }

    private function getAppDrivenEligible(User $childUser, StudentProfile $profile): Collection
    {
        $completedTopicIds = TopicCompletion::query()
            ->where('user_id', $childUser->id)
            ->pluck('canonical_topic_id');

        if ($completedTopicIds->isEmpty()) {
            return collect();
        }

        $topicToQuestionIds = QuestionTopicLink::query()
            ->whereIn('canonical_topic_id', $completedTopicIds)
            ->get(['canonical_topic_id', 'question_id'])
            ->groupBy('canonical_topic_id')
            ->map(fn ($rows) => $rows->pluck('question_id'));

        $allQuestionIds = $topicToQuestionIds->flatten()->unique()->values()->all();

        if (empty($allQuestionIds)) {
            return collect();
        }

        $answersByQuestion = PracticeAnswer::query()
            ->whereHas('practiceSession', fn ($q) => $q->where('user_id', $childUser->id))
            ->whereIn('question_id', $allQuestionIds)
            ->get(['question_id', 'is_correct'])
            ->groupBy('question_id');

        return CanonicalTopic::query()
            ->whereIn('id', $completedTopicIds)
            ->whereNotNull('parent_verification_kit')
            ->get()
            ->filter(function (CanonicalTopic $topic) use ($topicToQuestionIds, $answersByQuestion) {
                $qIds = $topicToQuestionIds->get($topic->id, collect());
                if ($qIds->isEmpty()) {
                    return false;
                }

                $answers = $qIds->flatMap(fn ($id) => $answersByQuestion->get($id, collect()));
                if ($answers->isEmpty()) {
                    return false;
                }

                return $answers->where('is_correct', true)->count() / $answers->count() >= 0.85;
            });
    }

    private function getCurriculumDrivenEligible(ParentChildLink $link, StudentProfile $profile): Collection
    {
        if (! $profile->education_level_id || ! $link->current_term || ! $link->term_start_date) {
            return collect();
        }

        $currentWeek = $this->getCurrentSchemeWeek($link);

        $schemeTopicIds = SchemeOfWorkItem::query()
            ->whereHas('levelSubject', function ($q) use ($profile) {
                $q->where('education_level_id', $profile->education_level_id);
            })
            ->where('term', $link->current_term->toInt())
            ->where('week_number', '<=', $currentWeek)
            ->whereNotNull('canonical_topic_id')
            ->pluck('canonical_topic_id');

        if ($schemeTopicIds->isEmpty()) {
            return collect();
        }

        $coveredOrSkippedIds = TopicCoverage::query()
            ->where('parent_child_link_id', $link->id)
            ->whereIn('status', [TopicCoverageStatus::Covered, TopicCoverageStatus::Skipped])
            ->pluck('canonical_topic_id');

        return CanonicalTopic::query()
            ->whereIn('id', $schemeTopicIds)
            ->whereNotIn('id', $coveredOrSkippedIds)
            ->whereNotNull('parent_verification_kit')
            ->get();
    }

    private function getCurrentSchemeWeek(ParentChildLink $link): int
    {
        if (! $link->term_start_date) {
            return 1;
        }

        $daysDiff = $link->term_start_date->diffInDays(now());

        return (int) floor($daysDiff / 7) + 1;
    }

    private function recomputeCorrectness(CanonicalTopic $topic, array $responses): array
    {
        $kit = $topic->parent_verification_kit;

        if (isset($responses['true_false']) && isset($kit['true_false'])) {
            foreach ($responses['true_false'] as $i => &$item) {
                if (isset($kit['true_false'][$i]['answer'])) {
                    $item['correct'] = ($item['child_answer'] ?? null) === $kit['true_false'][$i]['answer'];
                }
            }
            unset($item);
        }

        return $responses;
    }

    private function processMcqResponses(
        ParentChildLink $link,
        string $canonicalTopicId,
        array $mcqAnswers,
        User $parentUser,
    ): void {
        $questionIds = collect($mcqAnswers)->pluck('question_id')->filter()->values()->toArray();

        if (empty($questionIds)) {
            return;
        }

        $childUser = $link->studentProfile->user;

        $this->practiceService->createAdministeredSession($childUser, [
            'question_ids' => $questionIds,
            'canonical_topic_id' => $canonicalTopicId,
            'administered_by' => $parentUser->id,
        ]);
    }

    private function handleSpacedRepetitionAdjustment(
        User $childUser,
        string $canonicalTopicId,
        VerificationResult $overallResult,
    ): void {
        if ($overallResult === VerificationResult::Understood) {
            return;
        }

        $questionIds = QuestionTopicLink::query()
            ->where('canonical_topic_id', $canonicalTopicId)
            ->pluck('question_id');

        if ($questionIds->isEmpty()) {
            return;
        }

        if ($overallResult === VerificationResult::PartiallyUnderstood) {
            SpacedRepetitionItem::query()
                ->where('user_id', $childUser->id)
                ->whereIn('question_id', $questionIds)
                ->where('status', SpacedRepetitionStatus::Active)
                ->update([
                    'interval_days' => 1,
                    'next_review_at' => now()->addDay(),
                ]);
        } elseif ($overallResult === VerificationResult::NeedsReview) {
            SpacedRepetitionItem::query()
                ->where('user_id', $childUser->id)
                ->whereIn('question_id', $questionIds)
                ->update([
                    'status' => SpacedRepetitionStatus::Active,
                    'repetition_count' => 0,
                    'interval_days' => 1,
                    'next_review_at' => now()->addDay(),
                ]);
        }
    }
}
