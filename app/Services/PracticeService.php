<?php

namespace App\Services;

use App\Enums\AnswerDepthLevel;
use App\Enums\PracticeMode;
use App\Enums\QuestionType;
use App\Enums\SpacedRepetitionStatus;
use App\Models\PracticeAnswer;
use App\Models\PracticeSession;
use App\Models\Question;
use App\Models\SpacedRepetitionItem;
use App\Models\User;
use Illuminate\Support\Collection;

class PracticeService
{
    public function __construct(private SpacedRepetitionService $spacedRepService) {}

    public function createSession(User $user, array $config): PracticeSession
    {
        $questions = $this->selectQuestions($config);

        $topicIds = $config['topic_ids'] ?? [];
        $singleTopicId = count($topicIds) === 1 ? $topicIds[0] : ($config['canonical_topic_id'] ?? null);

        return PracticeSession::query()->create([
            'user_id' => $user->id,
            'institution_course_id' => $config['institution_course_id'] ?? null,
            'level_subject_id' => $config['level_subject_id'] ?? null,
            'canonical_topic_id' => $singleTopicId,
            'canonical_topic_ids' => ! empty($topicIds) ? $topicIds : null,
            'assessment_type_id' => $config['assessment_type_id'] ?? null,
            'mode' => $config['mode'],
            'question_count' => $questions->count(),
            'correct_count' => 0,
            'time_limit_seconds' => $config['time_limit_seconds'] ?? null,
            'is_resumable' => true,
            'last_activity_at' => now(),
            'question_ids' => $questions->pluck('id')->values()->toArray(),
            'administered_by' => $config['administered_by'] ?? null,
        ]);
    }

    /** @param array{question_ids: array, canonical_topic_id?: string, administered_by?: string} $config */
    public function createAdministeredSession(User $user, array $config): PracticeSession
    {
        return PracticeSession::query()->create([
            'user_id' => $user->id,
            'canonical_topic_id' => $config['canonical_topic_id'] ?? null,
            'mode' => PracticeMode::Untimed,
            'question_count' => count($config['question_ids']),
            'correct_count' => 0,
            'question_ids' => $config['question_ids'],
            'administered_by' => $config['administered_by'] ?? null,
            'is_resumable' => false,
            'last_activity_at' => now(),
        ]);
    }

    public function createReviewSession(User $user, array $questionIds, ?string $institutionCourseId = null, ?string $levelSubjectId = null): PracticeSession
    {
        return PracticeSession::query()->create([
            'user_id' => $user->id,
            'institution_course_id' => $institutionCourseId,
            'level_subject_id' => $levelSubjectId,
            'mode' => PracticeMode::Review,
            'question_count' => count($questionIds),
            'correct_count' => 0,
            'is_resumable' => true,
            'last_activity_at' => now(),
            'question_ids' => $questionIds,
        ]);
    }

    public function selectQuestions(array $config): Collection
    {
        if (! empty($config['question_id'])) {
            return Question::query()->where('id', $config['question_id'])->get();
        }

        $query = Question::query()->published();

        if (! empty($config['institution_course_id'])) {
            $query->where('institution_course_id', $config['institution_course_id']);
        }

        if (! empty($config['topic_ids'])) {
            $topicIds = $config['topic_ids'];
            $query->whereHas('topicLinks', fn ($q) => $q->whereIn('canonical_topic_id', $topicIds));
        }

        if (! empty($config['difficulty']) && $config['difficulty'] !== 'all') {
            $query->byDifficulty($config['difficulty']);
        }

        if (! empty($config['question_types'])) {
            $query->whereIn('question_type', $config['question_types']);
        }

        if (! empty($config['assessment_type_id'])) {
            $query->whereHas('questionAssessmentLinks', fn ($q) => $q->where('assessment_type_id', $config['assessment_type_id']));
        }

        if (! empty($config['exclude_user_id'])) {
            $userId = $config['exclude_user_id'];

            $recentlyCorrectIds = PracticeAnswer::query()
                ->where('is_correct', true)
                ->where('created_at', '>=', now()->subDays(7))
                ->whereHas('practiceSession', fn ($q) => $q->where('user_id', $userId))
                ->pluck('question_id');

            if ($recentlyCorrectIds->isNotEmpty()) {
                $query->whereNotIn('id', $recentlyCorrectIds);
            }
        }

        $limit = $config['question_count'] ?? 20;
        $mode = $config['mode'] ?? null;

        if ($mode === PracticeMode::YearWalk->value) {
            return $query->orderBy('year')->orderBy('id')->limit($limit)->get();
        }

        return $query->inRandomOrder()->limit($limit)->get();
    }

    public function getAvailableQuestionCount(array $config): int
    {
        $query = Question::query()->published();

        if (! empty($config['institution_course_id'])) {
            $query->where('institution_course_id', $config['institution_course_id']);
        }

        if (! empty($config['topic_ids'])) {
            $query->whereHas('topicLinks', fn ($q) => $q->whereIn('canonical_topic_id', $config['topic_ids']));
        }

        if (! empty($config['difficulty']) && $config['difficulty'] !== 'all') {
            $query->byDifficulty($config['difficulty']);
        }

        if (! empty($config['question_types'])) {
            $query->whereIn('question_type', $config['question_types']);
        }

        if (! empty($config['assessment_type_id'])) {
            $query->whereHas('questionAssessmentLinks', fn ($q) => $q->where('assessment_type_id', $config['assessment_type_id']));
        }

        return $query->count();
    }

    public function getSessionQuestions(PracticeSession $session): Collection
    {
        if (empty($session->question_ids)) {
            return collect();
        }

        $questions = Question::query()->whereIn('id', $session->question_ids)
            ->with([
                'topicLinks.canonicalTopic:id,title',
                'contexts',
                'children.contexts',
                'answers' => fn ($q) => $q->where('is_published', true)->where('depth_level', AnswerDepthLevel::Quick),
            ])
            ->get();

        $idOrder = array_flip($session->question_ids);

        return $questions->sortBy(fn ($q) => $idOrder[$q->id] ?? PHP_INT_MAX)->values();
    }

    public function submitAnswer(PracticeSession $session, Question $question, array $answerData): PracticeAnswer
    {
        $gradeData = array_merge($answerData['response_data'] ?? [], $answerData);
        $isCorrect = ! empty($answerData['was_skipped']) ? null : $this->gradeAnswer($question, $gradeData);

        $answer = PracticeAnswer::query()->create([
            'practice_session_id' => $session->id,
            'question_id' => $question->id,
            'selected_option_label' => $answerData['selected_label'] ?? null,
            'text_answer' => $answerData['text'] ?? null,
            'response_data' => $answerData,
            'is_correct' => $isCorrect,
            'time_spent_seconds' => $answerData['time_spent_seconds'] ?? 0,
            'was_skipped' => $answerData['was_skipped'] ?? false,
            'sequence_order' => $answerData['sequence_order'] ?? 0,
        ]);

        $question->increment('attempt_count');
        if ($isCorrect === true) {
            $question->increment('correct_count');
        }

        if ($session->mode === PracticeMode::Review && $isCorrect !== null) {
            $this->spacedRepService->processReviewAnswer($session->user, $question, $isCorrect);
        } elseif ($isCorrect) {
            $existingItem = SpacedRepetitionItem::query()->where('user_id', $session->user_id)
                ->where('question_id', $question->id)
                ->where('status', SpacedRepetitionStatus::Active)
                ->exists();
            if ($existingItem) {
                $this->spacedRepService->processReviewAnswer($session->user, $question, true);
            }
        }

        $session->update(['last_activity_at' => now()]);

        return $answer;
    }

    public function completeSession(PracticeSession $session): PracticeSession
    {
        $answers = $session->practiceAnswers()->with('question')->get();
        $gradableAnswers = $answers->whereNotNull('is_correct');
        $correctCount = $gradableAnswers->where('is_correct', true)->count();
        $totalGradable = $gradableAnswers->count();
        $scorePercentage = $totalGradable > 0
            ? round(($correctCount / $totalGradable) * 100, 2)
            : null;

        $session->update([
            'correct_count' => $correctCount,
            'total_time_seconds' => $answers->sum('time_spent_seconds'),
            'score_percentage' => $scorePercentage,
            'completed_at' => now(),
            'is_resumable' => false,
        ]);

        foreach ($answers as $answer) {
            if ($answer->is_correct === false && $answer->question) {
                $this->spacedRepService->scheduleReview($session->user, $answer->question, false);
            }
        }

        return $session->fresh();
    }

    public function isAutoGradable(QuestionType $type): bool
    {
        return in_array($type, [
            QuestionType::Mcq,
            QuestionType::MultiSelectMcq,
            QuestionType::TrueFalse,
            QuestionType::NumericEntry,
            QuestionType::AssertionReason,
            QuestionType::Cloze,
            QuestionType::Matching,
            QuestionType::Ordering,
            QuestionType::FillBlank,
            QuestionType::DiagramLabel,
            QuestionType::MatrixMatching,
        ]);
    }

    public function gradeAnswer(Question $question, array $responseData): ?bool
    {
        if (! $this->isAutoGradable($question->question_type)) {
            return null;
        }

        return match ($question->question_type) {
            QuestionType::Mcq => $this->gradeMcq($question, $responseData),
            QuestionType::MultiSelectMcq => $this->gradeMultiSelect($question, $responseData),
            QuestionType::TrueFalse => $this->gradeTrueFalse($question, $responseData),
            QuestionType::NumericEntry => $this->gradeNumericEntry($question, $responseData),
            QuestionType::AssertionReason => $this->gradeAssertionReason($question, $responseData),
            QuestionType::Cloze => $this->gradeCloze($question, $responseData),
            QuestionType::Matching => $this->gradeMatching($question, $responseData),
            QuestionType::Ordering => $this->gradeOrdering($question, $responseData),
            QuestionType::FillBlank => $this->gradeFillBlank($question, $responseData),
            QuestionType::DiagramLabel => $this->gradeDiagramLabel($question, $responseData),
            QuestionType::MatrixMatching => $this->gradeMatrixMatching($question, $responseData),
            default => null,
        };
    }

    private function gradeMcq(Question $question, array $responseData): bool
    {
        $selectedLabel = $responseData['selected_label'] ?? null;
        $options = $question->response_config['options'] ?? [];
        $correctOption = collect($options)->firstWhere('is_correct', true);

        return $correctOption && $selectedLabel === $correctOption['label'];
    }

    private function gradeMultiSelect(Question $question, array $responseData): bool
    {
        $selected = collect($responseData['selected_labels'] ?? [])->sort()->values()->toArray();
        $correct = collect($question->response_config['options'] ?? [])
            ->where('is_correct', true)
            ->pluck('label')
            ->sort()
            ->values()
            ->toArray();

        return $selected === $correct;
    }

    private function gradeTrueFalse(Question $question, array $responseData): bool
    {
        $answer = $responseData['answer'] ?? null;
        $correct = $question->response_config['correct_answer'] ?? null;

        if ($answer === null || $correct === null) {
            return false;
        }

        return filter_var($answer, FILTER_VALIDATE_BOOLEAN) === filter_var($correct, FILTER_VALIDATE_BOOLEAN);
    }

    private function gradeNumericEntry(Question $question, array $responseData): bool
    {
        $value = $responseData['value'] ?? null;
        $correct = $question->response_config['answer'] ?? null;

        if ($value === null || $correct === null) {
            return false;
        }

        $tolerance = (float) ($question->response_config['tolerance'] ?? 0);

        return abs((float) $value - (float) $correct) <= $tolerance;
    }

    private function gradeAssertionReason(Question $question, array $responseData): bool
    {
        $selected = $responseData['selected'] ?? null;
        $correctOption = collect($question->response_config['options'] ?? [])->firstWhere('is_correct', true);

        return $correctOption && $selected === $correctOption['label'];
    }

    private function gradeCloze(Question $question, array $responseData): bool
    {
        $studentGaps = $responseData['gaps'] ?? [];
        $configGaps = $question->response_config['gaps'] ?? [];

        if (empty($configGaps)) {
            return false;
        }

        foreach ($configGaps as $gap) {
            $position = (string) $gap['position'];

            if ((int) ($studentGaps[$position] ?? -1) !== (int) $gap['correct']) {
                return false;
            }
        }

        return true;
    }

    private function gradeMatching(Question $question, array $responseData): bool
    {
        $studentPairs = $responseData['pairs'] ?? [];
        $configPairs = $question->response_config['pairs'] ?? [];

        if (empty($configPairs)) {
            return false;
        }

        foreach ($configPairs as $leftIndex => $correctRightIndex) {
            if ((int) ($studentPairs[(string) $leftIndex] ?? -1) !== (int) $correctRightIndex) {
                return false;
            }
        }

        return true;
    }

    private function gradeOrdering(Question $question, array $responseData): bool
    {
        $student = array_map('intval', $responseData['order'] ?? []);
        $correct = array_map('intval', $question->response_config['correct_order'] ?? []);

        return $student === $correct;
    }

    private function gradeFillBlank(Question $question, array $responseData): bool
    {
        $studentBlanks = $responseData['blanks'] ?? [];
        $configBlanks = $question->response_config['blanks'] ?? [];
        $caseSensitive = $question->response_config['case_sensitive'] ?? false;

        if (empty($configBlanks)) {
            return false;
        }

        $correct = 0;

        foreach ($configBlanks as $blank) {
            $position = (string) $blank['position'];
            $studentAnswer = $studentBlanks[$position] ?? '';

            foreach ($blank['correct_answers'] ?? [] as $accepted) {
                $matches = $caseSensitive
                    ? $studentAnswer === $accepted
                    : strtolower(trim($studentAnswer)) === strtolower(trim($accepted));

                if ($matches) {
                    $correct++;
                    break;
                }
            }
        }

        return ($correct / count($configBlanks)) >= 0.8;
    }

    private function gradeDiagramLabel(Question $question, array $responseData): bool
    {
        $studentLabels = $responseData['labels'] ?? [];
        $configLabels = $question->response_config['labels'] ?? [];

        if (empty($configLabels)) {
            return false;
        }

        foreach ($configLabels as $index => $label) {
            $key = 'hotspot_'.$index;
            $student = strtolower(trim($studentLabels[$key] ?? ''));
            $correct = strtolower(trim($label['answer'] ?? ''));

            if ($student !== $correct) {
                return false;
            }
        }

        return true;
    }

    private function gradeMatrixMatching(Question $question, array $responseData): bool
    {
        $studentMatches = $responseData['matches'] ?? [];
        $correctMapping = $question->response_config['mapping'] ?? [];

        if (empty($correctMapping)) {
            return false;
        }

        foreach ($correctMapping as $leftIndex => $rightIndices) {
            $studentRight = array_map('intval', $studentMatches[(string) $leftIndex] ?? []);
            $correctRight = array_map('intval', (array) $rightIndices);
            sort($studentRight);
            sort($correctRight);

            if ($studentRight !== $correctRight) {
                return false;
            }
        }

        return true;
    }
}
