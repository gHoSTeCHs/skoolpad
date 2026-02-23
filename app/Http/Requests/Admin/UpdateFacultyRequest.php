<?php

namespace App\Http\Requests\Admin;

use App\Concerns\HasSharedValidationRules;
use Illuminate\Foundation\Http\FormRequest;

class UpdateFacultyRequest extends FormRequest
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
            'abbreviation' => ['nullable', 'string', 'max:50'],
        ];
    }

    /** @return array<string, array<int, mixed>> */
    protected function uniqueRules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
                $this->uniqueForUpdate('faculties', 'faculty', fn ($rule, $request) => $rule->where('institution_id', $request->route('faculty')->institution_id)),
            ],
        ];
    }
}
