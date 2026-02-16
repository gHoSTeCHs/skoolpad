<?php

namespace Database\Factories;

use App\Enums\Semester;
use App\Models\InstitutionCourse;
use App\Models\StudentProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\StudentCourse>
 */
class StudentCourseFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'student_profile_id' => StudentProfile::factory(),
            'institution_course_id' => InstitutionCourse::factory(),
            'semester' => Semester::First,
            'academic_year' => fake()->randomElement(['2023/2024', '2024/2025', '2025/2026']),
            'is_archived' => false,
        ];
    }
}
