<?php

namespace Database\Factories;

use App\Models\EducationSystem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CurriculumTier>
 */
class CurriculumTierFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);

        return [
            'education_system_id' => EducationSystem::factory(),
            'name' => $name,
            'slug' => \Illuminate\Support\Str::slug($name),
            'sort_order' => fake()->numberBetween(1, 10),
            'is_tertiary' => false,
        ];
    }

    public function tertiary(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_tertiary' => true,
        ]);
    }
}
