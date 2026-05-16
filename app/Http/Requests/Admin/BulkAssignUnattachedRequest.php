<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkAssignUnattachedRequest extends FormRequest
{
    public const ACTIONS = [
        'assign_course',
        'assign_exam_subject',
        'attach_paper',
        'delete',
    ];

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>|string> */
    public function rules(): array
    {
        $action = $this->input('action');

        return [
            'question_ids' => ['required', 'array', 'min:1', 'max:200'],
            'question_ids.*' => ['required', 'uuid', 'exists:questions,id'],
            'action' => ['required', 'string', Rule::in(self::ACTIONS)],
            'target_id' => [
                Rule::requiredIf(fn () => in_array($action, ['assign_course', 'assign_exam_subject', 'attach_paper'], true)),
                'nullable',
                'uuid',
                match ($action) {
                    'assign_course' => 'exists:institution_courses,id',
                    'assign_exam_subject' => 'exists:exam_subjects,id',
                    'attach_paper' => 'exists:question_papers,id',
                    default => 'nullable',
                },
            ],
        ];
    }
}
