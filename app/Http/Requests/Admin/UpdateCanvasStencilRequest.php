<?php

namespace App\Http\Requests\Admin;

use App\Enums\StencilCategory;
use App\Enums\StencilLicense;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCanvasStencilRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>|string> */
    public function rules(): array
    {
        $stencilId = $this->route('canvas_stencil')?->id ?? $this->route('canvas_stencil');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('canvas_stencils', 'slug')->ignore($stencilId)],
            'category' => ['sometimes', 'required', 'string', Rule::in(array_column(StencilCategory::cases(), 'value'))],
            'tags' => ['sometimes', 'nullable', 'array'],
            'tags.*' => ['string', 'max:64'],
            'svg_path' => ['sometimes', 'required', 'string', 'max:500'],
            'thumbnail_path' => ['sometimes', 'nullable', 'string', 'max:500'],
            'license' => ['sometimes', 'required', 'string', Rule::in(array_column(StencilLicense::cases(), 'value'))],
            'source_attribution' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'source_url' => ['sometimes', 'nullable', 'url', 'max:500'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            if ($this->has('license') && $this->input('license') === StencilLicense::CcBy4->value) {
                // If switching TO CC-BY-4.0 and no attribution is being set (or already set on the row)
                // require it. We can't know the existing row state here; admin should always send both.
                if (! trim((string) $this->input('source_attribution'))) {
                    $v->errors()->add(
                        'source_attribution',
                        'Attribution is required when license is CC-BY-4.0.',
                    );
                }
            }
        });
    }
}
