<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSchemeOfWorkRequest extends FormRequest
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
            'term' => ['required', 'integer', 'min:1', 'max:3'],
            'items' => ['present', 'array'],
            'items.*.week_number' => ['required', 'integer', 'min:1', 'max:13'],
            'items.*.topic_label' => ['required', 'string', 'max:255'],
            'items.*.canonical_topic_id' => ['nullable', 'uuid', 'exists:canonical_topics,id'],
            'items.*.content_block_id' => ['nullable', 'uuid', 'exists:content_blocks,id'],
        ];
    }
}
