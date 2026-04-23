<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class RunCurriculumResearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'document_text' => ['required', 'string', 'min:100', 'max:200000'],
            'model_id' => ['nullable', 'uuid', 'exists:ai_models,id'],
        ];
    }
}
