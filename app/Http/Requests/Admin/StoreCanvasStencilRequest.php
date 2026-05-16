<?php

namespace App\Http\Requests\Admin;

use App\Enums\StencilCategory;
use App\Enums\StencilLicense;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCanvasStencilRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>|string> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:canvas_stencils,slug'],
            'category' => ['required', 'string', Rule::in(array_column(StencilCategory::cases(), 'value'))],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:64'],

            // Either svg_content (inline upload) OR svg_path (already-uploaded asset)
            'svg_content' => ['required_without:svg_path', 'nullable', 'string'],
            'svg_path' => ['required_without:svg_content', 'nullable', 'string', 'max:500'],
            'thumbnail_path' => ['nullable', 'string', 'max:500'],

            'license' => ['required', 'string', Rule::in(array_column(StencilLicense::cases(), 'value'))],
            'source_attribution' => ['nullable', 'string', 'max:2000'],
            'source_url' => ['nullable', 'url', 'max:500'],

            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            // CC-BY-4.0 requires attribution to be set. Reject silent uploads.
            if ($this->input('license') === StencilLicense::CcBy4->value
                && ! trim((string) $this->input('source_attribution'))) {
                $v->errors()->add(
                    'source_attribution',
                    'Attribution is required for CC-BY-4.0 licensed stencils.',
                );
            }

            // Reject CC-BY-SA at the policy level even if someone sets the legacy value.
            $license = (string) $this->input('license');
            if (in_array($license, ['cc-by-sa', 'cc_by_sa', 'cc-by-sa-4', 'cc_by_sa_4'], true)) {
                $v->errors()->add(
                    'license',
                    'CC-BY-SA is rejected by Skoolpad SVG sourcing policy. Use a CC0, public-domain, CC-BY-4.0, or proprietary source.',
                );
            }

            // Reject svg_content that doesn't look like SVG.
            $content = trim((string) $this->input('svg_content'));
            if ($content !== '' && ! str_starts_with($content, '<svg') && ! str_starts_with($content, '<?xml')) {
                $v->errors()->add('svg_content', 'svg_content must be a valid SVG document.');
            }
        });
    }
}
