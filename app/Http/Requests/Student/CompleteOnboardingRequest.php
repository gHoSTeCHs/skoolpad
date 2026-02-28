<?php

namespace App\Http\Requests\Student;

use App\Models\Department;
use App\Models\EducationLevel;
use App\Models\Faculty;
use App\Models\Stream;
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
        $isTertiary = $this->input('student_type') === 'tertiary';
        $isSecondary = $this->input('student_type') === 'secondary';

        return [
            'student_type' => ['required', 'string', Rule::in(['tertiary', 'secondary'])],

            'institution_id' => [Rule::requiredIf($isTertiary), 'nullable', 'string', 'exists:institutions,id'],
            'faculty_id' => [Rule::requiredIf($isTertiary), 'nullable', 'string', 'exists:faculties,id'],
            'department_id' => [Rule::requiredIf($isTertiary), 'nullable', 'string', 'exists:departments,id'],
            'level' => [Rule::requiredIf($isTertiary), 'nullable', 'string'],
            'matric_number' => ['nullable', 'string', 'max:50'],
            'admission_year' => ['nullable', 'integer', 'min:2000', 'max:'.((int) date('Y') + 1)],
            'course_ids' => [Rule::requiredIf($isTertiary), 'nullable', 'array', Rule::when($isTertiary, ['min:1'])],
            'course_ids.*' => ['required', 'string', 'exists:institution_courses,id'],

            'education_system_id' => [Rule::requiredIf($isSecondary), 'nullable', 'string', 'exists:education_systems,id'],
            'education_level_id' => [Rule::requiredIf($isSecondary), 'nullable', 'string', 'exists:education_levels,id'],
            'stream_id' => ['nullable', 'string', 'exists:streams,id'],
            'school_name' => ['nullable', 'string', 'max:255'],
            'state_or_region' => ['nullable', 'string', 'max:255'],
            'exam_goals' => ['nullable', 'array'],
            'exam_goals.*' => ['required', 'string', 'exists:assessment_types,id'],
        ];
    }

    /** @return array<int, \Closure> */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($this->input('student_type') === 'tertiary') {
                    $this->validateTertiaryRelationships($validator);
                }

                if ($this->input('student_type') === 'secondary') {
                    $this->validateSecondaryRelationships($validator);
                }
            },
        ];
    }

    private function validateTertiaryRelationships(Validator $validator): void
    {
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
    }

    private function validateSecondaryRelationships(Validator $validator): void
    {
        if ($this->education_level_id && $this->education_system_id) {
            $level = EducationLevel::with('curriculumTier')->find($this->education_level_id);

            if ($level) {
                $tier = $level->curriculumTier;
                if ($tier && $tier->education_system_id !== $this->education_system_id) {
                    $validator->errors()->add(
                        'education_level_id',
                        'The selected education level does not belong to the selected education system.'
                    );
                }
            }
        }

        if ($this->stream_id && $this->education_system_id) {
            $stream = Stream::find($this->stream_id);

            if ($stream && $stream->education_system_id !== $this->education_system_id) {
                $validator->errors()->add(
                    'stream_id',
                    'The selected stream does not belong to the selected education system.'
                );
            }
        }
    }
}
