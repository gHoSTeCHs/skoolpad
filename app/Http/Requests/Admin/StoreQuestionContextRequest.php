<?php

namespace App\Http\Requests\Admin;

use App\Enums\ContextType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreQuestionContextRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'context_type' => ['required', 'string', Rule::in(array_column(ContextType::cases(), 'value'))],
            'title' => ['nullable', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'media_url' => ['nullable', 'url', 'max:2048'],
            'table_data' => ['nullable', 'array'],
            'table_data.headers' => ['required_with:table_data', 'array', 'min:1'],
            'table_data.headers.*' => ['required', 'string'],
            'table_data.rows' => ['required_with:table_data', 'array', 'min:1'],
            'table_data.rows.*' => ['required', 'array'],
            'word_bank' => ['nullable', 'array', 'min:1'],
            'word_bank.*' => ['required', 'string'],
            'language' => ['nullable', 'string', 'max:50'],
        ];
    }
}
