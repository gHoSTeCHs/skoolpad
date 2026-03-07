<?php

namespace App\Http\Requests\Student;

use App\Enums\PracticeMode;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StartPracticeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'institution_course_id' => ['required_without_all:question_id,level_subject_id', 'nullable', 'uuid', 'exists:institution_courses,id'],
            'level_subject_id' => ['required_without_all:question_id,institution_course_id', 'nullable', 'uuid', 'exists:level_subjects,id'],
            'topic_ids' => ['required_without:question_id', 'array', 'min:1'],
            'topic_ids.*' => ['uuid', 'exists:canonical_topics,id'],
            'question_types' => ['nullable', 'array'],
            'question_types.*' => ['string', Rule::in(array_column(\App\Enums\QuestionType::cases(), 'value'))],
            'difficulty' => ['nullable', 'string', Rule::in(['easy', 'medium', 'hard', 'all'])],
            'question_count' => ['required_without:question_id', 'integer', 'min:1', 'max:100'],
            'mode' => ['required_without:question_id', Rule::enum(PracticeMode::class)],
            'time_limit_seconds' => ['nullable', 'required_if:mode,timed', 'integer', 'min:30'],
            'assessment_type_id' => ['nullable', 'uuid', 'exists:assessment_types,id'],
            'question_id' => ['nullable', 'uuid', 'exists:questions,id'],
        ];
    }
}
