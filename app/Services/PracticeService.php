<?php

namespace App\Services;

use App\Enums\PracticeMode;
use App\Enums\QuestionType;
use App\Models\PracticeAnswer;
use App\Models\PracticeSession;
use App\Models\Question;
use App\Models\User;
use Illuminate\Support\Collection;

class PracticeService
{
    public function __construct(private SpacedRepetitionService $spacedRepService) {}

    public function createSession(User $user, array $config): PracticeSession
    {
        $questions = $this->selectQuestions($config);

        return PracticeSession::create([
            'user_id' => $user->id,
            'institution_course_id' => $config['institution_course_id'],
            'canonical_topic_id' => $config['canonical_topic_id'] ?? null,
            'assessment_type_id' => $config['assessment_type_id'] ?? null,
            'mode' => $config['mode'],
            'question_count' => $questions->count(),
            'correct_count' => 0,
            'time_limit_seconds' => $config['time_limit_seconds'] ?? null,
            'is_resumable' => true,
            'last_activity_at' => now(),
            'question_ids' => $questions->pluck('id')->values()->toArray(),
        ]);
    }

    public function selectQuestions(array $config): Collection
    {
        if (! empty($config['question_id'])) {
            return Question::where('id', $config['question_id'])->get();
        }

        $query = Question::query()
            ->published()
            ->whereNotNull('institution_course_id')
            ->where('institution_course_id', $config['institution_course_id']);

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

        return $query->inRandomOrder()->limit($limit)->get();
    }

    public function getAvailableQuestionCount(array $config): int
    {
        $query = Question::query()
            ->published()
            ->whereNotNull('institution_course_id')
            ->where('institution_course_id', $config['institution_course_id']);

        if (! empty($config['topic_ids'])) {
            $query->whereHas('topicLinks', fn ($q) => $q->whereIn('canonical_topic_id', $config['topic_ids']));
        }

        if (! empty($config['difficulty']) && $config['difficulty'] !== 'all') {
            $query->byDifficulty($config['difficulty']);
        }

        if (! empty($config['question_types'])) {
            $query->whereIn('question_type', $config['question_types']);
        }

        return $query->count();
    }

    public function getSessionQuestions(PracticeSession $session): Collection
    {
        if (empty($session->question_ids)) {
            return collect();
        }

        $questions = Question::whereIn('id', $session->question_ids)
            ->with([
                'topicLinks.canonicalTopic:id,title',
                'contexts',
                'children',
                'answers' => fn ($q) => $q->where('is_published', true)->where('depth_level', 'quick'),
            ])
            ->get();

        $idOrder = array_flip($session->question_ids);

        return $questions->sortBy(fn ($q) => $idOrder[$q->id] ?? PHP_INT_MAX)->values();
    }

    public function submitAnswer(PracticeSession $session, Question $question, array $answerData): PracticeAnswer
    {
        $isCorrect = ! empty($answerData['was_skipped']) ? null : $this->gradeAnswer($question, $answerData);

        $answer = PracticeAnswer::create([
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

        if ($session->mode === PracticeMode::Review) {
            $this->spacedRepService->processReviewAnswer($session->user, $question, (bool) $isCorrect);
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
            if ($answer->is_correct !== null) {
                $this->spacedRepService->scheduleReview($session->user, $answer->question, (bool) $answer->is_correct);
            }
        }

        return $session->fresh();
    }

    public function isAutoGradable(QuestionType $type): bool
    {
        return in_array($type, [
            QuestionType::Mcq,
        ]);
    }

    public function gradeAnswer(Question $question, array $responseData): ?bool
    {
        if (! $this->isAutoGradable($question->question_type)) {
            return null;
        }

        return match ($question->question_type) {
            QuestionType::Mcq => $this->gradeMcq($question, $responseData),
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
}
