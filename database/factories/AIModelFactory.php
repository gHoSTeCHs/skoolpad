<?php

namespace Database\Factories;

use App\Models\AIProvider;
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
            'provider_id' => AIProvider::factory(),
            'name' => fake()->unique()->words(3, true),
            'slug' => fake()->unique()->slug(3),
            'model_id' => 'test-model',
            'thinking_mode' => 'none',
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
            'provider_id' => AIProvider::factory()->anthropic(),
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
