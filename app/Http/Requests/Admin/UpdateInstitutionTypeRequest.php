<?php

namespace App\Http\Requests\Admin;

use App\Concerns\HasSharedValidationRules;
use Illuminate\Foundation\Http\FormRequest;

class UpdateInstitutionTypeRequest extends FormRequest
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
            'country_id' => ['required', 'exists:countries,id'],
            'name' => ['required', 'string', 'max:255'],
            'level_progression' => ['required', 'array', 'min:1'],
            'level_progression.*' => ['required', 'string', 'max:50'],
            'credit_system' => ['nullable', 'string', 'max:100'],
            'grading_scale_id' => ['nullable', 'exists:grading_scales,id'],
            'qualification_names' => ['nullable', 'array'],
            'qualification_names.*' => ['string', 'max:100'],
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
                $this->uniqueForUpdate('institution_types', 'institution_type'),
            ],
        ];
    }
}
