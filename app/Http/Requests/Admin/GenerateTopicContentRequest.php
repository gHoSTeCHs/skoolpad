<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class GenerateTopicContentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'model_id' => ['nullable', 'uuid', 'exists:ai_models,id'],
            'only_unstarted' => ['nullable', 'boolean'],
        ];
    }
}
