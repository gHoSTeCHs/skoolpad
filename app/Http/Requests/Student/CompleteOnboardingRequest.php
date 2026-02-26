<?php

namespace App\Http\Requests\Student;

use App\Models\Department;
use App\Models\Faculty;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class CompleteOnboardingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'institution_id' => ['required', 'string', 'exists:institutions,id'],
            'faculty_id' => ['required', 'string', 'exists:faculties,id'],
            'department_id' => ['required', 'string', 'exists:departments,id'],
            'level' => ['required', 'integer', Rule::in([100, 200, 300, 400, 500])],
            'matric_number' => ['nullable', 'string', 'max:50'],
            'admission_year' => ['nullable', 'integer', 'min:2000', 'max:'.((int) date('Y') + 1)],
            'course_ids' => ['required', 'array', 'min:1'],
            'course_ids.*' => ['required', 'string', 'exists:institution_courses,id'],
        ];
    }

    /** @return array<int, \Closure> */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($this->faculty_id && $this->institution_id) {
                    $faculty = Faculty::find($this->faculty_id);

                    if ($faculty && $faculty->institution_id !== $this->institution_id) {
                        $validator->errors()->add(
                            'faculty_id',
                            'The selected faculty does not belong to the selected institution.'
                        );
                    }
                }

                if ($this->department_id && $this->faculty_id) {
                    $department = Department::find($this->department_id);

                    if ($department && $department->faculty_id !== $this->faculty_id) {
                        $validator->errors()->add(
                            'department_id',
                            'The selected department does not belong to the selected faculty.'
                        );
                    }
                }
            },
        ];
    }
}
