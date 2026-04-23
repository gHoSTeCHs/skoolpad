<?php

namespace App\Http\Requests\Admin;

use App\Concerns\HasSharedValidationRules;
use App\Enums\AIAdapterType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAIModelRequest extends FormRequest
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
            'is_active' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
        ];
    }

    /** @return array<string, array<int, mixed>> */
    protected function uniqueRules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', $this->uniqueForStore('ai_models')],
            'slug' => ['nullable', 'string', 'max:255', 'alpha_dash', $this->uniqueForStore('ai_models')],
        ];
    }
}
