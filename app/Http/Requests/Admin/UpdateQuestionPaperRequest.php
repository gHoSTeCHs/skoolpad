<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateQuestionPaperRequest extends FormRequest
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
            'institution_course_id' => ['nullable', 'uuid', 'exists:institution_courses,id'],
            'assessment_type_id' => ['nullable', 'uuid', 'exists:assessment_types,id'],
            'academic_session' => ['nullable', 'string', 'max:50'],
            'semester' => ['nullable', 'string', 'in:first,second'],
            'year' => ['nullable', 'integer', 'min:1990', 'max:'.(date('Y') + 1)],
            'total_marks' => ['nullable', 'integer', 'min:1'],
            'duration_minutes' => ['nullable', 'integer', 'min:1'],
            'instructions' => ['nullable', 'string'],
            'is_published' => ['sometimes', 'boolean'],
        ];
    }
}
