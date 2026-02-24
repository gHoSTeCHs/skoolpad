<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAssessmentTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'alpha_dash'],
            'tier_id' => ['nullable', 'uuid', 'exists:curriculum_tiers,id'],
            'is_exit_exam' => ['required', 'boolean'],
            'is_entrance_exam' => ['required', 'boolean'],
            'grading_scale_id' => ['nullable', 'uuid', 'exists:grading_scales,id'],
        ];
    }
}
