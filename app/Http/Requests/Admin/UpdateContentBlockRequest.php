<?php

namespace App\Http\Requests\Admin;

use App\Enums\BlockDifficultyLevel;
use App\Enums\BlockType;
use App\Enums\BloomLevel;
use App\Models\ContentBlock;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\Validator;

class UpdateContentBlockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255'],
            'block_type' => ['required', new Enum(BlockType::class)],
            'is_container' => ['boolean'],
            'content' => ['nullable', 'array'],
            'simplified_content' => ['nullable', 'array'],
            'estimated_read_time' => ['nullable', 'integer', 'min:1', 'max:999'],
            'difficulty_level' => ['nullable', new Enum(BlockDifficultyLevel::class)],
            'bloom_level' => ['nullable', new Enum(BloomLevel::class)],
            'is_published' => ['boolean'],
            'prerequisites' => ['nullable', 'array'],
            'prerequisites.*.id' => ['required_with:prerequisites', 'string', 'exists:content_blocks,id'],
            'prerequisites.*.is_hard_prerequisite' => ['required_with:prerequisites', 'boolean'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                $prerequisites = $this->input('prerequisites', []);
                if (empty($prerequisites)) {
                    return;
                }

                /** @var ContentBlock $block */
                $block = $this->route('block');

                foreach ($prerequisites as $index => $prereq) {
                    if (($prereq['id'] ?? null) === $block->id) {
                        $validator->errors()->add(
                            "prerequisites.{$index}.id",
                            'A block cannot be a prerequisite of itself.'
                        );
                    }
                }

                $prerequisiteIds = collect($prerequisites)->pluck('id')->filter()->all();
                if (! empty($prerequisiteIds)) {
                    $crossTopicCount = ContentBlock::query()->whereIn('id', $prerequisiteIds)
                        ->where('canonical_topic_id', '!=', $block->canonical_topic_id)
                        ->count();

                    if ($crossTopicCount > 0) {
                        $validator->errors()->add(
                            'prerequisites',
                            'Prerequisites must belong to the same topic.'
                        );
                    }
                }
            },
        ];
    }
}
