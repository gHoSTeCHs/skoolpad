<?php

namespace Database\Factories;

use App\Models\CanonicalTopic;
use App\Models\EducationLevel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CanonicalTopicClassAssignment>
 */
class CanonicalTopicClassAssignmentFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'canonical_topic_id' => CanonicalTopic::factory(),
            'education_level_id' => EducationLevel::factory(),
            'depth' => fake()->randomElement(['introduction', 'intermediate', 'advanced', 'review']),
            'term_index' => fake()->optional()->numberBetween(1, 3),
            'is_primary' => false,
        ];
    }

    public function primary(): static
    {
        return $this->state(fn () => ['is_primary' => true]);
    }

    public function depth(string $depth): static
    {
        return $this->state(fn () => ['depth' => $depth]);
    }
}
