<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class RunSchemeGenerationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'terms_count' => ['required', 'integer', 'min:1', 'max:4'],
            'weeks_per_term' => ['required', 'integer', 'min:8', 'max:16'],
            'periods_per_week' => ['nullable', 'integer', 'min:1', 'max:10'],
            'minutes_per_period' => ['nullable', 'integer', 'min:20', 'max:90'],
            'model_id' => ['nullable', 'uuid', 'exists:ai_models,id'],
        ];
    }
}
