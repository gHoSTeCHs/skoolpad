<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class RunBlockStructureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'topic_key' => ['required', 'string', 'max:255'],
            'model_id' => ['nullable', 'uuid', 'exists:ai_models,id'],
        ];
    }
}
