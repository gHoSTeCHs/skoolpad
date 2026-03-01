<?php

namespace Database\Factories;

use App\Enums\BlockDifficultyLevel;
use App\Enums\BlockType;
use App\Enums\BloomLevel;
use App\Models\CanonicalTopic;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ContentBlock>
 */
class ContentBlockFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'canonical_topic_id' => CanonicalTopic::factory(),
            'parent_block_id' => null,
            'title' => fake()->sentence(3),
            'slug' => fake()->unique()->slug(),
            'block_type' => BlockType::Text,
            'path' => '1',
            'depth_level' => 0,
            'sort_order' => 1,
            'content' => [
                'type' => 'doc',
                'content' => [
                    ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => fake()->paragraph()]]],
                ],
            ],
            'simplified_content' => null,
            'estimated_read_time' => fake()->numberBetween(3, 15),
            'difficulty_level' => fake()->randomElement(BlockDifficultyLevel::cases()),
            'bloom_level' => fake()->randomElement(BloomLevel::cases()),
            'is_container' => false,
            'is_published' => false,
        ];
    }

    public function withSimplifiedContent(): static
    {
        return $this->state(fn (array $attributes) => [
            'simplified_content' => [
                'type' => 'doc',
                'content' => [
                    [
                        'type' => 'paragraph',
                        'content' => [
                            ['type' => 'text', 'text' => fake()->sentence()],
                        ],
                    ],
                ],
            ],
        ]);
    }

    public function container(): static
    {
        return $this->state(fn (array $attributes) => [
            'block_type' => BlockType::Container,
            'content' => null,
            'estimated_read_time' => null,
            'difficulty_level' => null,
            'bloom_level' => null,
            'is_container' => true,
        ]);
    }

    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_published' => true,
        ]);
    }
}
