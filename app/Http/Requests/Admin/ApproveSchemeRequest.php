<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ApproveSchemeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'terms' => ['required', 'array', 'min:1'],
            'terms.*.term_number' => ['required', 'integer', 'min:1', 'max:4'],
            'terms.*.instructional_weeks' => ['required', 'integer', 'min:1'],
            'terms.*.topics' => ['required', 'array'],
            'terms.*.topics.*.title' => ['required', 'string', 'max:500'],
            'terms.*.topics.*.week_start' => ['required', 'integer', 'min:1'],
            'terms.*.topics.*.week_end' => ['required', 'integer', 'min:1'],
            'terms.*.topics.*.periods' => ['required', 'integer', 'min:1'],
            'terms.*.topics.*.notes' => ['nullable', 'string'],
        ];
    }
}
