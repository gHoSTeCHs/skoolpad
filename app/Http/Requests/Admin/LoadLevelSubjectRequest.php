<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class LoadLevelSubjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'education_level_id' => ['required', 'uuid', 'exists:education_levels,id'],
            'curriculum_subject_id' => ['required', 'uuid', 'exists:curriculum_subjects,id'],
            'stream_id' => ['nullable', 'uuid', 'exists:streams,id'],
        ];
    }
}
