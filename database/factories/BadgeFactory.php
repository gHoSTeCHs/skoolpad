<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Badge>
 */
class BadgeFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $name = fake()->unique()->randomElement([
            'First Practice',
            'Week Streak',
            'Topic Master',
            'Quiz Champion',
            'Night Owl',
            'Early Bird',
            'Speed Demon',
            'Perfect Score',
            'Contributor',
            'Bookworm',
        ]);

        return [
            'slug' => Str::slug($name),
            'name' => $name,
            'description' => fake()->sentence(),
            'icon_path' => null,
            'requirement_type' => fake()->randomElement(['practice_count', 'streak_days', 'topics_completed', 'xp_earned']),
            'requirement_value' => fake()->randomElement([1, 5, 10, 25, 50, 100]),
            'requirement_subject_id' => null,
            'education_level' => 'all',
        ];
    }
}
