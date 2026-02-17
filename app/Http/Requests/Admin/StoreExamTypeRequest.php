<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExamTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'country_id' => ['required', 'exists:countries,id'],
            'name' => ['required', 'string', 'max:255', Rule::unique('exam_types')],
            'slug' => ['nullable', 'string', 'max:255', 'alpha_dash', Rule::unique('exam_types')],
            'description' => ['nullable', 'string'],
            'duration_minutes' => ['nullable', 'integer', 'min:1'],
            'questions_per_subject' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['boolean'],
        ];
    }
}
