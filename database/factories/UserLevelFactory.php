<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\UserLevel>
 */
class UserLevelFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'current_xp' => fake()->numberBetween(0, 5000),
            'current_level' => fake()->numberBetween(1, 50),
            'streak_days' => fake()->numberBetween(0, 30),
            'longest_streak' => fake()->numberBetween(0, 90),
            'last_activity_date' => fake()->date(),
            'streak_freeze_available' => fake()->boolean(30),
            'streak_freeze_used_at' => null,
        ];
    }
}
