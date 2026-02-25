<?php

namespace Database\Factories;

use App\Models\PracticeSession;
use App\Models\Question;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PracticeAnswer>
 */
class PracticeAnswerFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'practice_session_id' => PracticeSession::factory(),
            'question_id' => Question::factory(),
            'selected_option_label' => null,
            'text_answer' => null,
            'is_correct' => fake()->boolean(),
            'time_spent_seconds' => fake()->numberBetween(10, 300),
            'was_skipped' => false,
            'sequence_order' => fake()->numberBetween(1, 40),
        ];
    }

    public function skipped(): static
    {
        return $this->state(fn (array $attributes) => [
            'was_skipped' => true,
            'is_correct' => null,
            'selected_option_label' => null,
            'time_spent_seconds' => 0,
        ]);
    }
}
