<?php

namespace Database\Factories;

use App\Enums\TopicDifficulty;
use App\Models\Discipline;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CanonicalTopic>
 */
class CanonicalTopicFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $topics = [
            'Introduction to Algorithms',
            'Data Structures and Trees',
            'Linear Algebra Fundamentals',
            'Organic Chemistry Basics',
            'Electromagnetic Waves',
            'Cell Biology',
            'Thermodynamics',
            'Database Normalization',
            'Object Oriented Programming',
            'Calculus I: Limits and Continuity',
        ];

        $title = fake()->randomElement($topics);

        return [
            'discipline_id' => Discipline::factory(),
            'parent_topic_id' => null,
            'title' => $title,
            'slug' => Str::slug($title).'-'.Str::random(4),
            'content' => [
                'type' => 'doc',
                'content' => [
                    [
                        'type' => 'paragraph',
                        'content' => [
                            ['type' => 'text', 'text' => fake()->paragraph()],
                        ],
                    ],
                ],
            ],
            'content_plain' => fake()->paragraph(),
            'simplified_content' => null,
            'summary' => fake()->sentence(),
            'difficulty_level' => fake()->randomElement(TopicDifficulty::cases()),
            'estimated_read_minutes' => fake()->numberBetween(5, 30),
            'language' => 'en',
            'is_published' => true,
            'published_at' => now(),
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

    public function unpublished(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_published' => false,
            'published_at' => null,
        ]);
    }

    public function withGlossary(array $terms = [], array $symbols = []): static
    {
        return $this->state(fn () => [
            'glossary' => ['terms' => $terms, 'symbols' => $symbols],
        ]);
    }
}
