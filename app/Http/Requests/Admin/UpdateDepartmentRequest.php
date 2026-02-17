<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('departments')->where('faculty_id', $this->route('department')->faculty_id)->ignore($this->route('department'))],
            'abbreviation' => ['nullable', 'string', 'max:50'],
        ];
    }
}
