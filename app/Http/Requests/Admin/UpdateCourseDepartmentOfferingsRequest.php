<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCourseDepartmentOfferingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'offerings' => ['present', 'array'],
            'offerings.*.department_id' => ['required', 'uuid'],
            'offerings.*.is_compulsory' => ['required', 'boolean'],
        ];
    }
}
