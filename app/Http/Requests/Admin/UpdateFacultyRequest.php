<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFacultyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('faculties')->where('institution_id', $this->route('faculty')->institution_id)->ignore($this->route('faculty'))],
            'abbreviation' => ['nullable', 'string', 'max:50'],
        ];
    }
}
