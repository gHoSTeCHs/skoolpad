<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ReorderQuestionSectionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'sections' => ['required', 'array'],
            'sections.*.id' => ['required', 'uuid', 'exists:question_sections,id'],
            'sections.*.sort_order' => ['required', 'integer', 'min:0'],
        ];
    }
}
