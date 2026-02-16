<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Leaderboard>
 */
class LeaderboardFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'class_level' => fake()->randomElement(['100', '200', '300', '400', '500', null]),
            'weekly_xp' => fake()->numberBetween(0, 2000),
            'week_start' => fake()->dateTimeBetween('-4 weeks', 'now')->format('Y-m-d'),
            'rank' => fake()->numberBetween(1, 100),
        ];
    }
}
