<?php

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;

class ReverseCalculateCgpaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'current_cgpa' => ['required', 'numeric', 'min:0'],
            'current_credit_hours' => ['required', 'integer', 'min:0'],
            'target_cgpa' => ['required', 'numeric', 'min:0'],
            'remaining_credits' => ['required', 'integer', 'min:0'],
        ];
    }
}
