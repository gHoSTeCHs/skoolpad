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

    public function notStarted(): static
    {
        return $this->state(fn () => [
            'generation_status' => \App\Enums\BlockGenerationStatus::NotStarted->value,
            'content' => null,
            'summary_sentence' => null,
            'key_terms_introduced' => null,
            'symbols_used' => null,
        ]);
    }

    public function generated(): static
    {
        return $this->state(fn () => [
            'generation_status' => \App\Enums\BlockGenerationStatus::Generated->value,
            'content' => ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Sample']]]]],
            'summary_sentence' => 'Sample summary.',
            'key_terms_introduced' => [['term' => 'sample', 'definition' => 'a sample term']],
            'symbols_used' => [],
            'word_count' => 120,
            'nigerian_context_used' => true,
            'last_generated_at' => now(),
        ]);
    }

    public function approved(): static
    {
        return $this->generated()->state(fn () => [
            'generation_status' => \App\Enums\BlockGenerationStatus::Approved->value,
        ]);
    }

    public function leaf(): static
    {
        return $this->state(fn () => ['is_container' => false]);
    }

    public function at(string $path): static
    {
        return $this->state(fn () => [
            'path' => $path,
            'depth_level' => substr_count($path, '.'),
            'sort_order' => (int) last(explode('.', $path)),
        ]);
    }

    public function withGuidance(string $guidance): static
    {
        return $this->state(fn () => ['content_guidance' => $guidance]);
    }

    public function withAdvisory(\App\Models\ContentBlock $source, string $reason = 'both'): static
    {
        return $this->state(fn () => [
            'drift_advisory' => [
                'source_block_id' => $source->id,
                'source_block_title' => $source->title,
                'reason' => $reason,
                'terms_removed' => [],
                'terms_changed' => [],
                'symbols_removed' => [],
                'flagged_at' => now()->toIso8601String(),
            ],
        ]);
    }
}
