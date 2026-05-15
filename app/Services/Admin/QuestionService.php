<?php

namespace App\Services\Admin;

use App\Enums\QuestionStatus;
use App\Models\Question;
use App\Models\User;
use DomainException;
use Illuminate\Support\Facades\DB;

class QuestionService
{
    private const MAX_DEPTH = 3;

    /** @param array<string, mixed> $data */
    public function prepareQuestionData(array $data): array
    {
        if (! empty($data['parent_question_id'])) {
            $parent = Question::query()->find($data['parent_question_id']);
            if ($parent) {
                $data['depth_level'] = ($parent->depth_level ?? 0) + 1;
                $data['question_section_id'] = $data['question_section_id'] ?? $parent->question_section_id;
                $data['question_paper_id'] = $data['question_paper_id'] ?? $parent->question_paper_id;
                $data['institution_course_id'] = $data['institution_course_id'] ?? $parent->institution_course_id;
                $data['exam_subject_id'] = $data['exam_subject_id'] ?? $parent->exam_subject_id;
            } else {
                $data['depth_level'] = 0;
            }
        }

        if (! isset($data['sort_order'])) {
            $data['sort_order'] = Question::query()->where('question_section_id', $data['question_section_id'] ?? null)
                ->where('parent_question_id', $data['parent_question_id'] ?? null)
                ->count();
        }

        return $data;
    }

    /**
     * Persist a question along with its nested sub-questions in a single transaction.
     *
     * @param  array<string, mixed>  $data  The validated parent payload, expected to include `sub_questions`
     *                                      and optionally `choice_group`.
     */
    public function persistQuestionTree(array $data, ?Question $parent = null, int $depth = 0): Question
    {
        if ($depth > self::MAX_DEPTH) {
            throw new DomainException('Question hierarchy exceeds maximum depth of '.self::MAX_DEPTH.'.');
        }

        return DB::transaction(function () use ($data, $parent, $depth) {
            $children = $data['sub_questions'] ?? [];
            unset($data['sub_questions']);

            if ($parent) {
                $data['parent_question_id'] = $parent->id;
                $data['depth_level'] = $depth;
            }

            $data = $this->prepareQuestionData($data);
            $question = Question::query()->create($data);

            foreach ($children as $index => $child) {
                $child['sort_order'] = $child['sort_order'] ?? $index;
                $child['source'] = $child['source'] ?? ($data['source'] ?? null);
                $child['status'] = $child['status'] ?? ($data['status'] ?? null);
                $child['created_by'] = $child['created_by'] ?? ($data['created_by'] ?? null);
                unset($child['id']);
                $this->persistQuestionTree($child, $question, $depth + 1);
            }

            return $question;
        });
    }

    /**
     * Update a question and diff-and-sync its sub-questions.
     *
     * @param  array<string, mixed>  $data  Validated payload; expected to include `sub_questions` (full
     *                                      desired set; absent children will be deleted).
     */
    public function updateQuestionTree(Question $question, array $data, ?User $reviewer = null): Question
    {
        return DB::transaction(function () use ($question, $data, $reviewer) {
            $children = $data['sub_questions'] ?? [];
            unset($data['sub_questions']);

            if ($reviewer) {
                $data = $this->markPublishedIfNeeded($question, $data, $reviewer);
            }

            $question->update($data);

            $this->syncChildren($question, $children, $question->depth_level + 1, $data);

            return $question;
        });
    }

    /**
     * Sync the immediate children of a parent: update by id, create new ones, delete missing.
     *
     * @param  array<int, array<string, mixed>>  $desired
     * @param  array<string, mixed>  $parentData  Parent payload, used to inherit source/status/created_by on creates.
     */
    private function syncChildren(Question $parent, array $desired, int $childDepth, array $parentData): void
    {
        if ($childDepth > self::MAX_DEPTH) {
            throw new DomainException('Question hierarchy exceeds maximum depth of '.self::MAX_DEPTH.'.');
        }

        $existing = $parent->children()->get()->keyBy('id');
        $keptIds = [];

        foreach ($desired as $index => $child) {
            $child['sort_order'] = $child['sort_order'] ?? $index;
            $childId = $child['id'] ?? null;

            if ($childId && $existing->has($childId)) {
                $existingChild = $existing->get($childId);
                $existingChild->update([
                    'question_type' => $child['question_type'],
                    'content' => $child['content'],
                    'marks' => $child['marks'] ?? null,
                    'sort_order' => $child['sort_order'],
                    'response_config' => $child['response_config'] ?? null,
                ]);
                $keptIds[] = $childId;

                continue;
            }

            $payload = [
                'question_type' => $child['question_type'],
                'content' => $child['content'],
                'marks' => $child['marks'] ?? null,
                'sort_order' => $child['sort_order'],
                'response_config' => $child['response_config'] ?? null,
                'source' => $parentData['source'] ?? null,
                'status' => $parentData['status'] ?? null,
                'created_by' => $parentData['created_by'] ?? null,
                'depth_level' => $childDepth,
                'parent_question_id' => $parent->id,
            ];

            $created = Question::query()->create($payload);
            $keptIds[] = $created->id;
        }

        $toDelete = $existing->keys()->diff($keptIds);
        if ($toDelete->isNotEmpty()) {
            Question::query()->whereIn('id', $toDelete)->delete();
        }
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
        if (empty($items)) {
            return;
        }

        $params = [];
        $valueSets = [];

        foreach ($items as $item) {
            $valueSets[] = '(?::uuid, ?::int)';
            $params[] = $item['id'];
            $params[] = $item['sort_order'];
        }

        \Illuminate\Support\Facades\DB::statement(
            'UPDATE questions AS q SET sort_order = v.sort_order FROM (VALUES '.implode(', ', $valueSets).') AS v(id, sort_order) WHERE q.id = v.id',
            $params
        );
    }
}
