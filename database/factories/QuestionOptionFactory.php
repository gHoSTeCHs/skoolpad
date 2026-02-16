<?php

namespace Database\Factories;

use App\Models\Question;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\QuestionOption>
 */
class QuestionOptionFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'question_id' => Question::factory(),
            'label' => fake()->randomElement(['A', 'B', 'C', 'D']),
            'content' => fake()->sentence(),
            'is_correct' => false,
            'sort_order' => fake()->numberBetween(1, 4),
        ];
    }

    public function correct(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_correct' => true,
        ]);
    }
}
