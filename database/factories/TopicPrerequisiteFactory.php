<?php

namespace Database\Factories;

use App\Models\CanonicalTopic;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TopicPrerequisite>
 */
class TopicPrerequisiteFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'topic_id' => CanonicalTopic::factory(),
            'prerequisite_topic_id' => CanonicalTopic::factory(),
            'is_hard_prerequisite' => true,
        ];
    }

    public function soft(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_hard_prerequisite' => false,
        ]);
    }
}
