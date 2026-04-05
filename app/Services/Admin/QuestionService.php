<?php

namespace App\Services\Admin;

use App\Enums\QuestionStatus;
use App\Models\Question;
use App\Models\User;

class QuestionService
{
    /** @param array<string, mixed> $data */
    public function prepareQuestionData(array $data): array
    {
        if (! empty($data['parent_question_id'])) {
            $parent = Question::query()->find($data['parent_question_id']);
            $data['depth_level'] = $parent ? ($parent->depth_level ?? 0) + 1 : 0;
        }

        $data['sort_order'] = Question::query()->where('question_section_id', $data['question_section_id'] ?? null)
            ->where('parent_question_id', $data['parent_question_id'] ?? null)
            ->count();

        return $data;
    }

    /** @param array<string, mixed> $data */
    public function markPublishedIfNeeded(Question $question, array $data, User $reviewer): array
    {
        if (isset($data['status']) && $data['status'] === QuestionStatus::Published->value && $question->published_at === null) {
            $data['published_at'] = now();
            $data['reviewed_by'] = $reviewer->id;
        }

        return $data;
    }

    /** @param array<int, string> $topicIds */
    public function syncTopicLinks(Question $question, array $topicIds, ?string $primaryTopicId): void
    {
        $question->topicLinks()->delete();

        foreach ($topicIds as $topicId) {
            $question->topicLinks()->create([
                'canonical_topic_id' => $topicId,
                'is_primary' => $topicId === $primaryTopicId,
            ]);
        }
    }

    /** @param array<int, array{content_block_id: string, relevance: string}> $blockLinks */
    public function syncBlockLinks(Question $question, array $blockLinks): void
    {
        $question->questionBlockLinks()->delete();

        foreach ($blockLinks as $link) {
            $question->questionBlockLinks()->create([
                'content_block_id' => $link['content_block_id'],
                'relevance' => $link['relevance'],
            ]);
        }
    }

    /** @param array<int, array{id: string, sort_order: int}> $items */
    public function reorderQuestions(array $items): void
    {
        foreach ($items as $item) {
            Question::query()->where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
        }
    }
}
