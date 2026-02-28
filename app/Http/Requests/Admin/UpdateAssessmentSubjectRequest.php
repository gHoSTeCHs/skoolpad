<?php

namespace App\Http\Requests\Admin;

use App\Concerns\HasSharedValidationRules;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAssessmentSubjectRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'is_compulsory' => ['boolean'],
        ];
    }

    /** @return array<string, array<int, mixed>> */
    protected function uniqueRules(): array
    {
        return [
            'slug' => [
                'required',
                'string',
                'max:255',
                'alpha_dash',
                $this->uniqueForUpdate('assessment_subjects', 'assessment_subject', fn ($rule, $request) => $rule->where('assessment_type_id', $request->route('assessment_subject')->assessment_type_id)),
            ],
        ];
    }
}
