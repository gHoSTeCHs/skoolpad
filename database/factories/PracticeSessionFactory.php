<?php

namespace Database\Factories;

use App\Enums\PracticeMode;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PracticeSession>
 */
class PracticeSessionFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $questionCount = fake()->randomElement([10, 20, 30, 40]);

        return [
            'user_id' => User::factory(),
            'institution_course_id' => null,
            'canonical_topic_id' => null,
            'mode' => fake()->randomElement(PracticeMode::cases()),
            'question_count' => $questionCount,
            'correct_count' => fake()->numberBetween(0, $questionCount),
            'total_time_seconds' => fake()->numberBetween(300, 3600),
            'time_limit_seconds' => null,
            'score_percentage' => null,
            'tier_at_creation' => null,
            'is_resumable' => true,
            'last_activity_at' => now(),
            'completed_at' => null,
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'completed_at' => now(),
            'is_resumable' => false,
            'score_percentage' => fake()->randomFloat(2, 0, 100),
        ]);
    }
}
