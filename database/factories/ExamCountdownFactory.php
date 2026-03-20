<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\ExamCountdown>
 */
class ExamCountdownFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'exam_name' => fake()->randomElement(['WAEC Mathematics', 'NECO Biology', 'Term 1 Physics', 'JAMB English']),
            'exam_date' => now()->addWeeks(fake()->numberBetween(1, 12)),
            'alert_start_days_before' => 14,
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    public function examInDays(int $days): static
    {
        return $this->state(fn (array $attributes) => [
            'exam_date' => now()->addDays($days),
        ]);
    }
}
