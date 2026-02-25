<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreQuestionSectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'label' => ['required', 'string', 'max:100'],
            'instruction' => ['nullable', 'string'],
            'marks' => ['nullable', 'integer', 'min:1'],
            'required_count' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
