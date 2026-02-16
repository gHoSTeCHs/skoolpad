<?php

namespace Database\Factories;

use App\Enums\ContributionBadge;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ContributionStat>
 */
class ContributionStatFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $total = fake()->numberBetween(0, 50);
        $approved = fake()->numberBetween(0, $total);
        $rejected = fake()->numberBetween(0, $total - $approved);

        return [
            'user_id' => User::factory(),
            'total_submissions' => $total,
            'approved_submissions' => $approved,
            'rejected_submissions' => $rejected,
            'contribution_points' => $approved * 10,
            'badge' => fake()->randomElement(ContributionBadge::cases()),
        ];
    }
}
