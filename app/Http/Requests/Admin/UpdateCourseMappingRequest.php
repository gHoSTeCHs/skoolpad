<?php

namespace App\Http\Requests\Admin;

use App\Enums\TopicWeight;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCourseMappingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'mappings' => ['present', 'array'],
            'mappings.*.canonical_topic_id' => ['required', 'string', 'exists:canonical_topics,id'],
            'mappings.*.sequence_order' => ['required', 'integer', 'min:1'],
            'mappings.*.weight' => ['required', 'string', Rule::in(TopicWeight::values())],
        ];
    }
}
