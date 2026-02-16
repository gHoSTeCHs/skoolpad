<?php

namespace Database\Factories;

use App\Enums\AnswerDepthLevel;
use App\Models\Question;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\QuestionAnswer>
 */
class QuestionAnswerFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'question_id' => Question::factory(),
            'depth_level' => AnswerDepthLevel::Standard,
            'content' => [['type' => 'paragraph', 'text' => fake()->paragraph()]],
            'content_plain' => fake()->paragraph(),
            'is_published' => true,
            'created_by' => User::factory(),
        ];
    }

    public function quick(): static
    {
        return $this->state(fn (array $attributes) => [
            'depth_level' => AnswerDepthLevel::Quick,
        ]);
    }

    public function deepDive(): static
    {
        return $this->state(fn (array $attributes) => [
            'depth_level' => AnswerDepthLevel::DeepDive,
        ]);
    }
}
