<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateExamSubjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'exam_type_id' => ['required', 'exists:exam_types,id'],
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'alpha_dash', Rule::unique('exam_subjects')->where('exam_type_id', $this->exam_type_id)->ignore($this->route('exam_subject'))],
            'is_compulsory' => ['boolean'],
        ];
    }
}
