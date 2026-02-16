<?php

namespace Database\Factories;

use App\Models\Badge;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\UserBadge>
 */
class UserBadgeFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'badge_id' => Badge::factory(),
            'earned_at' => now(),
        ];
    }
}
