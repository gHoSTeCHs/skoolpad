<?php

namespace App\Http\Requests\ParentDashboard;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class CreateChildAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'child_name' => ['required', 'string', 'max:255'],
            'child_email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'child_password' => ['required', 'confirmed', Password::defaults()],
            'education_level_id' => ['required', 'uuid', 'exists:education_levels,id'],
            'subjects' => ['nullable', 'array'],
        ];
    }
}
