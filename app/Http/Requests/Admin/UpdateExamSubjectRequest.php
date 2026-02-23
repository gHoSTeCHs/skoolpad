<?php

namespace App\Http\Requests\Admin;

use App\Concerns\HasSharedValidationRules;
use Illuminate\Foundation\Http\FormRequest;

class UpdateExamSubjectRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'is_compulsory' => ['boolean'],
        ];
    }

    /** @return array<string, array<int, mixed>> */
    protected function uniqueRules(): array
    {
        return [
            'slug' => [
                'required',
                'string',
                'max:255',
                'alpha_dash',
                $this->uniqueForUpdate('exam_subjects', 'examSubject', fn ($rule, $request) => $rule->where('exam_type_id', $request->route('examSubject')->exam_type_id)),
            ],
        ];
    }
}
