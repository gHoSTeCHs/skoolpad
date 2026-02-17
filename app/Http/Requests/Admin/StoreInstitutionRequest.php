<?php

namespace App\Http\Requests\Admin;

use App\Enums\InstitutionType;
use App\Enums\OwnershipType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInstitutionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('institutions')],
            'abbreviation' => ['required', 'string', 'max:50', Rule::unique('institutions')],
            'institution_type' => ['required', Rule::enum(InstitutionType::class)],
            'ownership_type' => ['required', Rule::enum(OwnershipType::class)],
            'country_id' => ['required', 'exists:countries,id'],
            'state' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'website' => ['nullable', 'url', 'max:255'],
            'logo' => ['nullable', 'image', 'mimes:jpeg,png,webp', 'max:2048'],
            'is_active' => ['boolean'],
        ];
    }
}
