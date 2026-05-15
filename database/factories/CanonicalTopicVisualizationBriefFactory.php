<?php

namespace Database\Factories;

use App\Models\CanonicalTopic;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CanonicalTopicVisualizationBrief>
 */
class CanonicalTopicVisualizationBriefFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'canonical_topic_id' => CanonicalTopic::factory(),
            'visualization_score' => fake()->numberBetween(0, 5),
            'intents_json' => [
                ['kind' => 'free_body', 'description' => fake()->sentence()],
                ['kind' => 'circuit_diagram', 'description' => fake()->sentence()],
            ],
            'computed_at' => now(),
            'computed_from_paper_count' => fake()->numberBetween(0, 50),
        ];
    }
}
