<?php

namespace App\Http\Requests\ParentDashboard;

use Illuminate\Foundation\Http\FormRequest;

class CompleteCheckInRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'completed_items' => ['required', 'array'],
            'completed_items.*.canonical_topic_id' => ['required', 'uuid'],
            'completed_items.*.type' => ['required', 'string', 'in:verification,weak_area_review,topic_preview,scheme_alignment'],
            'completed_items.*.completed' => ['required', 'boolean'],
        ];
    }
}
