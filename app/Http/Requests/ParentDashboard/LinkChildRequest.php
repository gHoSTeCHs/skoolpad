<?php

namespace App\Http\Requests\ParentDashboard;

use Illuminate\Foundation\Http\FormRequest;

class LinkChildRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'invite_code' => ['required', 'string', 'size:6', 'exists:student_profiles,invite_code'],
        ];
    }
}
