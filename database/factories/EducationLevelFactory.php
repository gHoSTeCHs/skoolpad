<?php

namespace Database\Factories;

use App\Models\CurriculumTier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\EducationLevel>
 */
class EducationLevelFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'curriculum_tier_id' => CurriculumTier::factory(),
            'name' => fake()->unique()->words(2, true),
            'display_name' => fake()->words(2, true),
            'sort_order' => fake()->numberBetween(1, 10),
            'typical_age_min' => fake()->numberBetween(6, 18),
            'typical_age_max' => fake()->numberBetween(12, 25),
        ];
    }
}
