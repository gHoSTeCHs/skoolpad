<?php

namespace Database\Factories;

use App\Enums\AcademicStatus;
use App\Models\Department;
use App\Models\Faculty;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\StudentProfile>
 */
class StudentProfileFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $institution = Institution::factory()->create();
        $faculty = Faculty::factory()->for($institution)->create();
        $department = Department::factory()->for($faculty)->create();
        $admissionYear = fake()->numberBetween(2019, 2025);
        $abbr = $institution->abbreviation;

        return [
            'user_id' => User::factory(),
            'institution_id' => $institution->id,
            'faculty_id' => $faculty->id,
            'department_id' => $department->id,
            'level' => fake()->randomElement([100, 200, 300, 400, 500]),
            'matric_number' => $abbr.'/'.substr($admissionYear, 2).'/CS/'.fake()->unique()->numerify('###'),
            'admission_year' => $admissionYear,
            'academic_status' => AcademicStatus::Active,
            'academic_status_changed_at' => null,
        ];
    }
}
