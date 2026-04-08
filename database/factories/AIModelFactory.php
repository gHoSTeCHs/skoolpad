<?php

namespace Database\Factories;

use App\Enums\AIAdapterType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AIModel>
 */
class AIModelFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(3, true),
            'slug' => fake()->unique()->slug(3),
            'adapter_type' => AIAdapterType::OpenAICompatible,
            'base_url' => 'https://api.example.com/v1',
            'api_key' => 'test-key-' . fake()->uuid(),
            'model_id' => 'test-model',
            'max_tokens' => 8192,
            'input_cost_per_million' => 100,
            'output_cost_per_million' => 300,
            'is_active' => true,
            'sort_order' => 0,
        ];
    }

    public function anthropic(): static
    {
        return $this->state(fn (array $attributes) => [
            'adapter_type' => AIAdapterType::Anthropic,
            'base_url' => 'https://api.anthropic.com/v1',
            'model_id' => 'claude-sonnet-4-20250514',
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
