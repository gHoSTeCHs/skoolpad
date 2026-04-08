<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ApproveResearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'topics' => ['required', 'array', 'min:1'],
            'topics.*.title' => ['required', 'string', 'max:500'],
            'topics.*.sub_topics' => ['present', 'array'],
            'topics.*.sub_topics.*' => ['string'],
            'topics.*.term_number' => ['required', 'integer', 'min:1', 'max:4'],
            'topics.*.sequence' => ['required', 'integer', 'min:1'],
            'topics.*.estimated_hours' => ['nullable', 'numeric', 'min:0'],
            'topics.*.practical_component' => ['required', 'boolean'],
            'topics.*.waec_alignment_note' => ['nullable', 'string'],
        ];
    }
}
