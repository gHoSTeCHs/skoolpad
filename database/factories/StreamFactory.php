<?php

namespace Database\Factories;

use App\Models\CurriculumTier;
use App\Models\EducationSystem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Stream>
 */
class StreamFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'education_system_id' => EducationSystem::factory(),
            'name' => fake()->randomElement(['Science', 'Arts', 'Commercial', 'Technology']),
            'applies_from_tier_id' => CurriculumTier::factory(),
        ];
    }
}
