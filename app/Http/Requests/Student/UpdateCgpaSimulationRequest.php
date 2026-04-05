<?php

namespace App\Http\Requests\Student;

use App\Services\Student\CgpaSimulatorService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCgpaSimulationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        $scale = app(CgpaSimulatorService::class)->getGradingScale($this->user());
        $scaleMax = $scale?->scale_max ?? 10;
        $validGrades = $scale?->grade_boundaries
            ? array_map(fn (array $b) => $b['label'], $scale->grade_boundaries)
            : [];

        return [
            'name' => ['nullable', 'string', 'max:100'],
            'mode' => ['required', 'string', 'in:quick,detailed'],
            'current_cgpa' => ['required', 'numeric', 'min:0', 'max:'.$scaleMax],
            'current_credit_hours' => ['required', 'integer', 'min:0', 'max:500'],
            'projected_grades' => ['required', 'array', 'min:1'],
            'projected_grades.*.course_code' => ['required', 'string', 'max:20'],
            'projected_grades.*.course_title' => ['nullable', 'string', 'max:255'],
            'projected_grades.*.credit_units' => ['required', 'integer', 'min:1', 'max:12'],
            'projected_grades.*.grade' => ['required', 'string', 'max:5', Rule::in($validGrades)],
            'semester_data' => ['nullable', 'array'],
            'semester_data.*.level' => ['required', 'string', 'max:20'],
            'semester_data.*.semester' => ['required', 'string', 'max:20'],
            'semester_data.*.courses' => ['required', 'array', 'min:1'],
            'semester_data.*.courses.*.course_code' => ['required', 'string', 'max:20'],
            'semester_data.*.courses.*.course_title' => ['nullable', 'string', 'max:255'],
            'semester_data.*.courses.*.credit_units' => ['required', 'integer', 'min:1', 'max:12'],
            'semester_data.*.courses.*.grade' => ['required', 'string', 'max:5', Rule::in($validGrades)],
            'target_cgpa' => ['nullable', 'numeric', 'min:0', 'max:'.$scaleMax],
        ];
    }
}
