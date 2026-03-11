<?php

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;

class StoreNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'array'],
            'is_pinned' => ['boolean'],
            'canonical_topic_id' => ['nullable', 'uuid', 'exists:canonical_topics,id'],
            'institution_course_id' => ['nullable', 'uuid', 'exists:institution_courses,id'],
        ];
    }
}
