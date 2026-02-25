<?php

namespace Database\Factories;

use App\Enums\QuestionDifficulty;
use App\Enums\QuestionSource;
use App\Enums\QuestionStatus;
use App\Enums\QuestionType;
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
            'marks' => fake()->randomElement([1, 2, 5, 10]),
            'difficulty_level' => fake()->randomElement(QuestionDifficulty::cases()),
            'sort_order' => 0,
            'depth_level' => 0,
            'is_published' => false,
            'year' => fake()->numberBetween(2018, 2025),
            'semester' => fake()->randomElement(['first', 'second']),
            'attempt_count' => 0,
            'correct_count' => 0,
            'avg_time_seconds' => null,
            'response_config' => [
                'options' => [
                    ['label' => 'A', 'text' => fake()->sentence(), 'is_correct' => false],
                    ['label' => 'B', 'text' => fake()->sentence(), 'is_correct' => true],
                    ['label' => 'C', 'text' => fake()->sentence(), 'is_correct' => false],
                    ['label' => 'D', 'text' => fake()->sentence(), 'is_correct' => false],
                ],
            ],
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
            'response_config' => null,
        ]);
    }

    public function trueFalse(): static
    {
        return $this->state(fn (array $attributes) => [
            'question_type' => QuestionType::TrueFalse,
            'response_config' => [
                'correct_answer' => true,
                'requires_justification' => false,
            ],
        ]);
    }

    public function calculation(): static
    {
        return $this->state(fn (array $attributes) => [
            'question_type' => QuestionType::Calculation,
            'response_config' => [
                'answer' => '42',
                'unit' => 'cm',
                'tolerance' => 0.1,
            ],
        ]);
    }

    public function forPaper(): static
    {
        return $this->state(fn (array $attributes) => [
            'question_paper_id' => \App\Models\QuestionPaper::factory(),
            'question_number' => '1',
            'display_label' => 'Question 1',
            'institution_course_id' => null,
        ]);
    }

    public function group(): static
    {
        return $this->state(fn (array $attributes) => [
            'question_type' => QuestionType::Group,
            'marks' => null,
            'response_config' => null,
        ]);
    }
}
