<?php

namespace App\Http\Requests\Admin;

use App\Concerns\HasSharedValidationRules;
use App\Enums\ScaleType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreGradingScaleRequest extends FormRequest
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
            'scale_type' => ['required', new Enum(ScaleType::class)],
            'scale_min' => ['required', 'numeric'],
            'scale_max' => ['required', 'numeric', 'gte:scale_min'],
            'pass_threshold' => ['required', 'numeric'],
            'grade_boundaries' => ['required', 'array', 'min:1'],
            'grade_boundaries.*.grade' => ['required', 'string', 'max:20'],
            'grade_boundaries.*.min' => ['required', 'numeric'],
            'grade_boundaries.*.max' => ['required', 'numeric', 'gte:grade_boundaries.*.min'],
            'grade_boundaries.*.points' => ['required', 'numeric'],
            'classification_labels' => ['nullable', 'json'],
        ];
    }

    /** @return array<string, array<int, mixed>> */
    protected function uniqueRules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', $this->uniqueForStore('grading_scales')],
        ];
    }
}
