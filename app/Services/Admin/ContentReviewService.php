<?php

namespace App\Services\Admin;

use App\Enums\ContentSubmissionStatus;
use App\Enums\ContentSubmissionType;
use App\Enums\QuestionSource;
use App\Enums\QuestionStatus;
use App\Models\ContentSubmission;
use App\Models\Question;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ContentReviewService
{
    public function approveSubmission(ContentSubmission $submission, User $reviewer): void
    {
        if ($submission->status !== ContentSubmissionStatus::Pending) {
            throw new \InvalidArgumentException('Only pending submissions can be approved.');
        }

        $submission->update([
            'status' => ContentSubmissionStatus::Approved,
            'reviewer_id' => $reviewer->id,
            'reviewed_at' => now(),
        ]);

        if ($submission->submission_type === ContentSubmissionType::Question && is_array($submission->content)) {
            $this->createQuestionFromSubmission($submission);
        }
    }

    public function rejectSubmission(ContentSubmission $submission, User $reviewer, string $notes): void
    {
        if ($submission->status !== ContentSubmissionStatus::Pending) {
            throw new \InvalidArgumentException('Only pending submissions can be rejected.');
        }

        $submission->update([
            'status' => ContentSubmissionStatus::Rejected,
            'reviewer_id' => $reviewer->id,
            'reviewer_notes' => $notes,
            'reviewed_at' => now(),
        ]);
    }

    /**
     * @param array<int, array{
     *   institution_course_id: string,
     *   question_type: string,
     *   content: string,
     *   year: ?int,
     *   semester: ?string,
     *   difficulty_level: ?string,
     *   options: ?array<int, array{content: string, is_correct: bool}>,
     *   topic_id: string,
     * }> $questions
     * @return array<int, string>
     */
    public function transcribeUpload(ContentSubmission $submission, array $questions, User $reviewer): array
    {
        if ($submission->submission_type !== ContentSubmissionType::PastQuestionUpload) {
            throw new \InvalidArgumentException('Only past question uploads can be transcribed.');
        }

        if (! in_array($submission->status, [ContentSubmissionStatus::Pending, ContentSubmissionStatus::Approved])) {
            throw new \InvalidArgumentException('Only pending or approved submissions can be transcribed.');
        }

        return DB::transaction(function () use ($submission, $questions, $reviewer) {
            $createdIds = [];

            foreach ($questions as $qData) {
                $responseConfig = null;
                if ($qData['question_type'] === 'mcq' && ! empty($qData['options'])) {
                    $responseConfig = $this->buildMcqResponseConfig($qData['options']);
                }

                $question = Question::query()->create([
                    'institution_course_id' => $qData['institution_course_id'],
                    'question_type' => $qData['question_type'],
                    'content' => $qData['content'],
                    'year' => $qData['year'] ?? null,
                    'semester' => $qData['semester'] ?? null,
                    'difficulty_level' => $qData['difficulty_level'] ?? null,
                    'response_config' => $responseConfig,
                    'source' => QuestionSource::Crowdsourced,
                    'status' => QuestionStatus::Draft,
                    'created_by' => $reviewer->id,
                ]);

                if (! empty($qData['topic_id'])) {
                    $question->topicLinks()->create([
                        'canonical_topic_id' => $qData['topic_id'],
                        'is_primary' => true,
                    ]);
                }

                $createdIds[] = $question->id;
            }

            if ($submission->status === ContentSubmissionStatus::Pending) {
                $submission->update([
                    'status' => ContentSubmissionStatus::Approved,
                    'reviewer_id' => $reviewer->id,
                    'reviewed_at' => now(),
                ]);
            }

            return $createdIds;
        });
    }

    private function createQuestionFromSubmission(ContentSubmission $submission): void
    {
        $content = $submission->content;

        if (empty($content['content']) || empty($content['question_type'])) {
            return;
        }

        $responseConfig = null;
        if ($content['question_type'] === 'mcq' && ! empty($content['options'])) {
            $responseConfig = $this->buildMcqResponseConfig($content['options']);
        }

        $question = Question::query()->create([
            'institution_course_id' => $submission->institution_course_id,
            'question_type' => $content['question_type'],
            'content' => $content['content'],
            'year' => $submission->exam_year,
            'semester' => $submission->exam_semester?->value,
            'response_config' => $responseConfig,
            'source' => QuestionSource::Crowdsourced,
            'status' => QuestionStatus::Draft,
            'created_by' => $submission->submitted_by,
        ]);

        if (! empty($content['topic_id'])) {
            $question->topicLinks()->create([
                'canonical_topic_id' => $content['topic_id'],
                'is_primary' => true,
            ]);
        }
    }

    /**
     * @param  array<int, array{content: string, is_correct: bool}>  $options
     * @return array{options: array<int, array{label: string, text: string, is_correct: bool}>}
     */
    private function buildMcqResponseConfig(array $options): array
    {
        $labels = ['A', 'B', 'C', 'D', 'E'];

        return [
            'options' => array_values(array_map(fn ($option, $index) => [
                'label' => $labels[$index] ?? $labels[0],
                'text' => $option['content'],
                'is_correct' => (bool) ($option['is_correct'] ?? false),
            ], $options, array_keys($options))),
        ];
    }
}
