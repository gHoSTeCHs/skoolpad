<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class LinkQuestionContextRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'context_id' => ['required', 'uuid', 'exists:question_contexts,id'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'label' => ['nullable', 'string', 'max:100'],
        ];
    }
}
