<?php

namespace App\Http\Requests\Admin;

use App\Enums\BlockDifficultyLevel;
use App\Enums\BlockType;
use App\Enums\BloomLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreContentBlockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'parent_block_id' => ['nullable', 'uuid', 'exists:content_blocks,id'],
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255'],
            'block_type' => ['required', new Enum(BlockType::class)],
            'is_container' => ['boolean'],
            'content' => ['nullable', 'array'],
            'estimated_read_time' => ['nullable', 'integer', 'min:1', 'max:999'],
            'difficulty_level' => ['nullable', new Enum(BlockDifficultyLevel::class)],
            'bloom_level' => ['nullable', new Enum(BloomLevel::class)],
            'is_published' => ['boolean'],
        ];
    }
}
