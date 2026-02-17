<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDisciplineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('disciplines')->ignore($this->route('discipline'))],
            'slug' => ['required', 'string', 'max:255', 'alpha_dash', Rule::unique('disciplines')->ignore($this->route('discipline'))],
            'description' => ['nullable', 'string'],
            'icon' => ['nullable', 'string', 'max:100'],
        ];
    }
}
