<?php

namespace App\Http\Requests\Admin;

use App\Enums\TeachingDepth;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateCurriculumMappingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'curriculum_subject_level_id' => ['required', 'uuid', 'exists:level_subjects,id'],
            'mappings' => ['present', 'array'],
            'mappings.*.content_block_id' => ['required', 'uuid', 'exists:content_blocks,id'],
            'mappings.*.teaching_depth' => ['required', new Enum(TeachingDepth::class)],
            'mappings.*.is_core_block' => ['required', 'boolean'],
        ];
    }
}
