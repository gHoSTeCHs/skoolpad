<?php

namespace Database\Factories;

use App\Models\QuestionPaper;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\QuestionSection>
 */
class QuestionSectionFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'question_paper_id' => QuestionPaper::factory(),
            'label' => fake()->randomElement(['A', 'B', 'C', 'Part I', 'Part II']),
            'instruction' => fake()->randomElement(['Answer ALL questions', 'Answer any TWO questions', 'Answer any THREE questions']),
            'marks' => fake()->randomElement([20, 30, 40, 50]),
            'required_count' => null,
            'sort_order' => fake()->numberBetween(1, 5),
        ];
    }

    public function withRequiredCount(int $count = 2): static
    {
        return $this->state(fn (array $attributes) => [
            'required_count' => $count,
        ]);
    }
}
