<?php

namespace Database\Factories;

use App\Enums\SpacedRepetitionStatus;
use App\Models\Question;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SpacedRepetitionItem>
 */
class SpacedRepetitionItemFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'question_id' => Question::factory(),
            'ease_factor' => 2.50,
            'interval_days' => 1,
            'repetition_count' => 0,
            'next_review_at' => now()->addDay()->toDateString(),
            'last_reviewed_at' => null,
            'status' => SpacedRepetitionStatus::Active,
        ];
    }
}
