<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class TranscribeUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'questions' => ['required', 'array', 'min:1'],
            'questions.*.institution_course_id' => ['required', 'uuid', 'exists:institution_courses,id'],
            'questions.*.question_type' => ['required', 'string', 'in:mcq,theory,fill_in_blank'],
            'questions.*.content' => ['required', 'string'],
            'questions.*.year' => ['nullable', 'integer', 'min:1990', 'max:'.date('Y')],
            'questions.*.semester' => ['nullable', 'string', 'in:first,second'],
            'questions.*.difficulty_level' => ['nullable', 'string', 'in:easy,medium,hard'],
            'questions.*.topic_id' => ['required', 'uuid', 'exists:canonical_topics,id'],
            'questions.*.options' => ['nullable', 'array'],
            'questions.*.options.*.content' => ['required_with:questions.*.options', 'string'],
            'questions.*.options.*.is_correct' => ['required_with:questions.*.options', 'boolean'],
        ];
    }
}
