<?php

namespace App\Http\Requests\Admin;

use App\Enums\AssetKind;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateContentBlockAssetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>|string> */
    public function rules(): array
    {
        return [
            // Owner FKs are immutable post-create. Re-scoping requires a new asset.
            'kind' => ['sometimes', 'required', 'string', Rule::in(array_column(AssetKind::cases(), 'value'))],
            'excalidraw_json' => ['sometimes', 'nullable', 'array'],
            'svg_payload' => ['sometimes', 'nullable', 'string'],
            'alt_text' => ['sometimes', 'nullable', 'string', 'max:500'],
            'caption' => ['sometimes', 'nullable', 'string', 'max:500'],
        ];
    }
}
