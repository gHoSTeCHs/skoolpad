<?php

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExamTimetableRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'institution_course_id' => ['required_without:level_subject_id', 'nullable', 'uuid', 'exists:institution_courses,id'],
            'level_subject_id' => ['required_without:institution_course_id', 'nullable', 'uuid', 'exists:level_subjects,id'],
            'assessment_type_id' => ['nullable', 'uuid', 'exists:assessment_types,id'],
            'label' => ['required', 'string', 'max:255'],
            'exam_date' => ['required', 'date'],
            'exam_time' => ['nullable', 'date_format:H:i'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'aoc_topic_ids' => ['nullable', 'array'],
            'aoc_topic_ids.*' => ['uuid', 'exists:canonical_topics,id'],
        ];
    }
}
