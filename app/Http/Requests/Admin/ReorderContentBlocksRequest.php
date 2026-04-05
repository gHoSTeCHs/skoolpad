<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ReorderContentBlocksRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'uuid', 'exists:content_blocks,id'],
            'items.*.parent_block_id' => ['nullable', 'uuid', 'exists:content_blocks,id'],
            'items.*.sort_order' => ['required', 'integer', 'min:1'],
        ];
    }
}
