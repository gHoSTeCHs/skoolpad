<?php

namespace Database\Factories;

use App\Models\Institution;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CalendarTerm>
 */
class CalendarTermFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'institution_id' => Institution::factory(),
            'academic_year' => '2025/2026',
            'name' => fake()->randomElement(['First Semester', 'Second Semester']),
            'start_date' => fake()->date(),
            'end_date' => fake()->date(),
            'sort_order' => fake()->numberBetween(1, 3),
        ];
    }
}
