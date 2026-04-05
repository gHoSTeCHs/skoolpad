<?php

namespace App\Http\Requests\Admin;

use App\Enums\TeachingDepth;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateCourseBlockMappingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'mappings' => ['present', 'array'],
            'mappings.*.content_block_id' => ['required', 'uuid', 'exists:content_blocks,id'],
            'mappings.*.teaching_depth' => ['required', new Enum(TeachingDepth::class)],
            'mappings.*.is_core_block' => ['required', 'boolean'],
            'mappings.*.week_start' => ['nullable', 'integer', 'min:1'],
            'mappings.*.week_end' => ['nullable', 'integer', 'min:1', 'gte:mappings.*.week_start'],
            'mappings.*.lecture_hours' => ['nullable', 'numeric', 'min:0'],
            'mappings.*.lab_hours' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
