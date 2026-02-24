<?php

namespace Database\Factories;

use App\Models\AssessmentType;
use App\Models\InstitutionCourse;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\QuestionPaper>
 */
class QuestionPaperFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'institution_course_id' => InstitutionCourse::factory(),
            'assessment_type_id' => null,
            'title' => fake()->sentence(),
            'academic_session' => '2024/2025',
            'semester' => fake()->randomElement(['First Semester', 'Second Semester']),
            'year' => null,
            'total_marks' => fake()->randomElement([40, 60, 70, 100]),
            'duration_minutes' => fake()->randomElement([60, 90, 120, 180]),
            'instructions' => fake()->optional()->paragraph(),
            'is_published' => false,
        ];
    }

    public function forAssessmentType(): static
    {
        return $this->state(fn (array $attributes) => [
            'assessment_type_id' => AssessmentType::factory(),
            'institution_course_id' => null,
            'academic_session' => null,
            'semester' => null,
            'year' => fake()->numberBetween(2018, 2025),
        ]);
    }

    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_published' => true,
        ]);
    }
}
