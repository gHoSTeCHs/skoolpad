<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\XpTransaction>
 */
class XpTransactionFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'action' => fake()->randomElement(['practice_complete', 'streak_bonus', 'topic_complete', 'badge_earned']),
            'xp_amount' => fake()->numberBetween(5, 100),
            'reference_type' => null,
            'reference_id' => null,
        ];
    }
}
