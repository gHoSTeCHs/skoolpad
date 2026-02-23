<?php

namespace App\Http\Requests\Admin;

use App\Concerns\HasSharedValidationRules;
use Illuminate\Foundation\Http\FormRequest;

class StoreExamTypeRequest extends FormRequest
{
    use HasSharedValidationRules;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    protected function sharedRules(): array
    {
        return [
            'country_id' => ['required', 'exists:countries,id'],
            'description' => ['nullable', 'string'],
            'duration_minutes' => ['nullable', 'integer', 'min:1'],
            'questions_per_subject' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['boolean'],
        ];
    }

    /** @return array<string, array<int, mixed>> */
    protected function uniqueRules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', $this->uniqueForStore('exam_types')],
            'slug' => ['nullable', 'string', 'max:255', 'alpha_dash', $this->uniqueForStore('exam_types')],
        ];
    }
}
