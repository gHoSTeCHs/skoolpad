<?php

namespace App\Http\Requests\Admin;

use App\Concerns\HasSharedValidationRules;
use Illuminate\Foundation\Http\FormRequest;

class UpdateDisciplineRequest extends FormRequest
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
            'description' => ['nullable', 'string'],
            'icon' => ['nullable', 'string', 'max:100'],
        ];
    }

    /** @return array<string, array<int, mixed>> */
    protected function uniqueRules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', $this->uniqueForUpdate('disciplines', 'discipline')],
            'slug' => ['required', 'string', 'max:255', 'alpha_dash', $this->uniqueForUpdate('disciplines', 'discipline')],
        ];
    }
}
