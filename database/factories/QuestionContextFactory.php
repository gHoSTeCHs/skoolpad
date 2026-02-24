<?php

namespace Database\Factories;

use App\Enums\ContextType;
use App\Models\QuestionPaper;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\QuestionContext>
 */
class QuestionContextFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'question_paper_id' => QuestionPaper::factory(),
            'context_type' => ContextType::Passage,
            'title' => fake()->sentence(),
            'content' => fake()->paragraphs(3, true),
            'media_url' => null,
            'table_data' => null,
            'word_bank' => null,
            'language' => null,
        ];
    }

    public function reusable(): static
    {
        return $this->state(fn (array $attributes) => [
            'question_paper_id' => null,
        ]);
    }

    public function diagram(): static
    {
        return $this->state(fn (array $attributes) => [
            'context_type' => ContextType::Diagram,
            'content' => null,
            'media_url' => fake()->url(),
        ]);
    }

    public function codeSnippet(string $language = 'python'): static
    {
        return $this->state(fn (array $attributes) => [
            'context_type' => ContextType::CodeSnippet,
            'content' => 'def hello():\n    return "Hello, World!"',
            'language' => $language,
        ]);
    }

    public function withWordBank(): static
    {
        return $this->state(fn (array $attributes) => [
            'context_type' => ContextType::WordBank,
            'content' => null,
            'word_bank' => ['photosynthesis', 'chlorophyll', 'glucose', 'carbon dioxide', 'oxygen'],
        ]);
    }

    public function withTableData(): static
    {
        return $this->state(fn (array $attributes) => [
            'context_type' => ContextType::Table,
            'content' => null,
            'table_data' => [
                'headers' => ['Element', 'Symbol', 'Atomic Number'],
                'rows' => [
                    ['Hydrogen', 'H', '1'],
                    ['Helium', 'He', '2'],
                ],
            ],
        ]);
    }
}
