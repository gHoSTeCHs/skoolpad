<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ReorderQuestionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'questions' => ['required', 'array'],
            'questions.*.id' => ['required', 'uuid', 'exists:questions,id'],
            'questions.*.sort_order' => ['required', 'integer', 'min:0'],
        ];
    }
}
