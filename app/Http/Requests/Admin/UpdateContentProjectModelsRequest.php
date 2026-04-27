<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateContentProjectModelsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'default_ai_model_id' => ['nullable', 'uuid', 'exists:ai_models,id'],
            'research_model_id' => ['nullable', 'uuid', 'exists:ai_models,id'],
            'scheme_model_id' => ['nullable', 'uuid', 'exists:ai_models,id'],
            'blocks_model_id' => ['nullable', 'uuid', 'exists:ai_models,id'],
            'content_model_id' => ['nullable', 'uuid', 'exists:ai_models,id'],
        ];
    }
}
