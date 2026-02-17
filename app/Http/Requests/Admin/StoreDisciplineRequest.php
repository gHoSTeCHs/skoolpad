<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDisciplineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('disciplines')],
            'slug' => ['nullable', 'string', 'max:255', 'alpha_dash', Rule::unique('disciplines')],
            'description' => ['nullable', 'string'],
            'icon' => ['nullable', 'string', 'max:100'],
        ];
    }
}
