<?php

namespace App\Http\Requests\Admin;

use App\Concerns\HasSharedValidationRules;
use App\Enums\InstitutionType;
use App\Enums\OwnershipType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateInstitutionRequest extends FormRequest
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
            'institution_type' => ['required', Rule::enum(InstitutionType::class)],
            'institution_type_id' => ['nullable', 'exists:institution_types,id'],
            'ownership_type' => ['required', Rule::enum(OwnershipType::class)],
            'country_id' => ['required', 'exists:countries,id'],
            'state' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'website' => ['nullable', 'url', 'max:255'],
            'logo' => ['nullable', 'image', 'mimes:jpeg,png,webp', 'max:2048'],
            'is_active' => ['boolean'],
        ];
    }

    /** @return array<string, array<int, mixed>> */
    protected function uniqueRules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', $this->uniqueForUpdate('institutions', 'institution')],
            'abbreviation' => ['required', 'string', 'max:50', $this->uniqueForUpdate('institutions', 'institution')],
        ];
    }
}
