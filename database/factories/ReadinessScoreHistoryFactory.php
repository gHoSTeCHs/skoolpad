<?php

namespace Database\Factories;

use App\Models\LevelSubject;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ReadinessScoreHistory>
 */
class ReadinessScoreHistoryFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'curriculum_subject_level_id' => LevelSubject::factory(),
            'composite_score' => fake()->randomFloat(2, 0, 100),
            'recorded_at' => now(),
        ];
    }

    public function score(float $score): static
    {
        return $this->state(fn () => ['composite_score' => $score]);
    }

    public function recordedAt(string $date): static
    {
        return $this->state(fn () => ['recorded_at' => $date]);
    }
}
