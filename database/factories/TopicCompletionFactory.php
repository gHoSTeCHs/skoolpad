<?php

namespace Database\Factories;

use App\Models\CanonicalTopic;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TopicCompletion>
 */
class TopicCompletionFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'canonical_topic_id' => CanonicalTopic::factory(),
            'completed_at' => now(),
        ];
    }
}
