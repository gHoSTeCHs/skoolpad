<?php

namespace Database\Factories;

use App\Enums\QuestionDifficulty;
use App\Enums\QuestionSource;
use App\Enums\QuestionStatus;
use App\Enums\QuestionType;
use App\Enums\Semester;
use App\Models\InstitutionCourse;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Question>
 */
class QuestionFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'institution_course_id' => InstitutionCourse::factory(),
            'question_type' => QuestionType::Mcq,
            'content' => fake()->paragraph(),
            'year' => fake()->numberBetween(2018, 2025),
            'semester' => fake()->randomElement(Semester::cases()),
            'marks' => fake()->randomElement([1, 2, 5, 10]),
            'difficulty_level' => fake()->randomElement(QuestionDifficulty::cases()),
            'attempt_count' => 0,
            'correct_count' => 0,
            'avg_time_seconds' => null,
            'source' => QuestionSource::Manual,
            'status' => QuestionStatus::Published,
            'created_by' => User::factory(),
            'reviewed_by' => null,
            'published_at' => now(),
        ];
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => QuestionStatus::Draft,
            'published_at' => null,
        ]);
    }

    public function theory(): static
    {
        return $this->state(fn (array $attributes) => [
            'question_type' => QuestionType::Theory,
        ]);
    }
}
