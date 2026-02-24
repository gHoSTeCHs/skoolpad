<?php

namespace App\Http\Requests\Admin;

use App\Concerns\HasSharedValidationRules;
use App\Enums\EducationSystemType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreEducationSystemRequest extends FormRequest
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
            'country_id' => ['nullable', 'uuid', 'exists:countries,id'],
            'system_type' => ['required', new Enum(EducationSystemType::class)],
        ];
    }

    /** @return array<string, array<int, mixed>> */
    protected function uniqueRules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', $this->uniqueForStore('education_systems')],
            'slug' => ['nullable', 'string', 'max:255', 'alpha_dash', $this->uniqueForStore('education_systems')],
        ];
    }
}
