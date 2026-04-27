<?php

namespace Database\Factories;

use App\Enums\AIAdapterType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AIProvider>
 */
class AIProviderFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->company(),
            'slug' => fake()->unique()->slug(2),
            'adapter_type' => AIAdapterType::OpenAICompatible,
            'base_url' => 'https://api.example.com/v1',
            'api_key' => 'test-key-'.fake()->uuid(),
            'supports_thinking' => false,
            'is_active' => true,
            'sort_order' => 0,
        ];
    }

    public function anthropic(): static
    {
        return $this->state(fn (array $attributes) => [
            'adapter_type' => AIAdapterType::Anthropic,
            'base_url' => 'https://api.anthropic.com/v1',
            'supports_thinking' => false,
        ]);
    }
}
