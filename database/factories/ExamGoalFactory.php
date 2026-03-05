<?php

namespace Database\Factories;

use App\Models\AssessmentType;
use App\Models\InstitutionCourse;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ExamGoal>
 */
class ExamGoalFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'assessment_type_id' => AssessmentType::factory(),
            'institution_course_id' => null,
            'exam_date' => fake()->dateTimeBetween('+1 month', '+6 months'),
            'target_score' => fake()->randomFloat(2, 50, 90),
            'is_active' => true,
        ];
    }

    public function withCourse(): static
    {
        return $this->state(fn () => [
            'institution_course_id' => InstitutionCourse::factory(),
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
