<?php

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;

class CalculateCgpaRequest extends FormRequest
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
            'projected_grades' => ['required', 'array', 'min:1'],
            'projected_grades.*.credit_units' => ['required', 'integer', 'min:1'],
            'projected_grades.*.grade' => ['required', 'string'],
        ];
    }
}
