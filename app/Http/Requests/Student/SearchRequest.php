<?php

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;

class SearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'q' => ['required', 'string', 'min:2', 'max:255'],
        ];
    }
}
