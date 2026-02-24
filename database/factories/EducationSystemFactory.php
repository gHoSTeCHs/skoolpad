<?php

namespace Database\Factories;

use App\Enums\EducationSystemType;
use App\Models\Country;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\EducationSystem>
 */
class EducationSystemFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);

        return [
            'name' => $name,
            'slug' => \Illuminate\Support\Str::slug($name),
            'country_id' => Country::factory(),
            'system_type' => fake()->randomElement(EducationSystemType::cases()),
        ];
    }

    public function national(): static
    {
        return $this->state(fn (array $attributes) => [
            'system_type' => EducationSystemType::National,
        ]);
    }

    public function international(): static
    {
        return $this->state(fn (array $attributes) => [
            'system_type' => EducationSystemType::International,
            'country_id' => null,
        ]);
    }
}
