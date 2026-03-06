<?php

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;

class SubmitAnswerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'question_id' => ['required', 'uuid', 'exists:questions,id'],
            'selected_label' => ['nullable', 'string'],
            'text' => ['nullable', 'string'],
            'response_data' => ['nullable', 'array'],
            'time_spent_seconds' => ['required', 'integer', 'min:0'],
            'sequence_order' => ['required', 'integer', 'min:0'],
            'was_skipped' => ['boolean'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'question_id.exists' => 'The selected question does not exist.',
        ];
    }
}
