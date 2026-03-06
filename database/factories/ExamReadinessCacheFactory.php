<?php

namespace Database\Factories;

use App\Models\LevelSubject;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ExamReadinessCache>
 */
class ExamReadinessCacheFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'curriculum_subject_level_id' => LevelSubject::factory(),
            'syllabus_coverage' => fake()->randomFloat(2, 0, 100),
            'practice_performance' => fake()->randomFloat(2, 0, 100),
            'spaced_retention' => fake()->randomFloat(2, 0, 100),
            'parent_verification' => fake()->randomFloat(2, 0, 100),
            'composite_score' => fake()->randomFloat(2, 0, 100),
            'calculated_at' => now(),
        ];
    }
}
