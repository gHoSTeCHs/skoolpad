<?php

namespace App\Http\Requests\Admin;

use App\Enums\CourseScope;
use App\Enums\Semester;
use App\Models\Department;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreInstitutionCourseRequest extends FormRequest
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
            'owning_department_id' => ['required', 'string', 'exists:departments,id'],
            'discipline_id' => ['required', 'string', 'exists:disciplines,id'],
            'course_code' => [
                'required', 'string', 'max:50',
                Rule::unique('institution_courses', 'course_code')
                    ->where('institution_id', $this->institution_id),
            ],
            'course_title' => ['required', 'string', 'max:255'],
            'level' => ['required', 'string', 'max:10'],
            'semester' => ['required', 'string', Rule::in(Semester::values())],
            'credit_units' => ['nullable', 'integer', 'min:1', 'max:12'],
            'is_elective' => ['nullable', 'boolean'],
            'course_scope' => ['required', 'string', Rule::in(CourseScope::values())],
            'description' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /** @return array<int, \Closure> */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($this->owning_department_id && $this->institution_id) {
                    $dept = Department::with('faculty')->find($this->owning_department_id);

                    if ($dept && $dept->faculty && $dept->faculty->institution_id !== $this->institution_id) {
                        $validator->errors()->add(
                            'owning_department_id',
                            'The selected department does not belong to the selected institution.'
                        );
                    }
                }
            },
        ];
    }
}
