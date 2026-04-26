<?php

namespace App\Http\Requests\Admin;

use App\Concerns\HasSharedValidationRules;
use App\Enums\AIAdapterType;
use App\Enums\ThinkingMode;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAIModelRequest extends FormRequest
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
            'adapter_type' => ['required', 'string', Rule::in(array_column(AIAdapterType::cases(), 'value'))],
            'base_url' => ['required', 'url', 'max:500'],
            'api_key' => ['nullable', 'string', 'max:1000'],
            'model_id' => ['required', 'string', 'max:255'],
            'max_tokens' => ['required', 'integer', 'min:100', 'max:200000'],
            'input_cost_per_million' => ['required', 'integer', 'min:0'],
            'output_cost_per_million' => ['required', 'integer', 'min:0'],
            'thinking_mode' => ['nullable', Rule::in(array_column(ThinkingMode::cases(), 'value'))],
            'is_active' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
        ];
    }

    /** @return array<string, array<int, mixed>> */
    protected function uniqueRules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', $this->uniqueForUpdate('ai_models', 'ai_model')],
            'slug' => ['required', 'string', 'max:255', 'alpha_dash', $this->uniqueForUpdate('ai_models', 'ai_model')],
        ];
    }
}
