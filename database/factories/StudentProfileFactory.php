<?php

namespace Database\Factories;

use App\Enums\AcademicStatus;
use App\Enums\StudentType;
use App\Models\Department;
use App\Models\EducationLevel;
use App\Models\EducationSystem;
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
            'student_type' => StudentType::Tertiary,
            'institution_id' => $institution->id,
            'faculty_id' => $faculty->id,
            'department_id' => $department->id,
            'level' => fake()->randomElement(['100L', '200L', '300L', '400L', '500L']),
            'matric_number' => $abbr.'/'.substr($admissionYear, 2).'/CS/'.fake()->unique()->numerify('###'),
            'admission_year' => $admissionYear,
            'academic_status' => AcademicStatus::Active,
            'academic_status_changed_at' => null,
        ];
    }

    public function secondary(): static
    {
        return $this->state(function () {
            $educationSystem = EducationSystem::factory()->create();
            $tier = \App\Models\CurriculumTier::factory()->for($educationSystem)->create(['is_tertiary' => false]);
            $level = EducationLevel::factory()->for($tier, 'curriculumTier')->create();

            return [
                'student_type' => StudentType::Secondary,
                'institution_id' => null,
                'faculty_id' => null,
                'department_id' => null,
                'matric_number' => null,
                'level' => null,
                'admission_year' => null,
                'education_system_id' => $educationSystem->id,
                'education_level_id' => $level->id,
            ];
        });
    }
}
