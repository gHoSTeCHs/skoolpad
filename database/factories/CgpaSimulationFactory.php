<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CgpaSimulation>
 */
class CgpaSimulationFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $currentCgpa = fake()->randomFloat(2, 1.00, 5.00);

        return [
            'user_id' => User::factory(),
            'name' => fake()->randomElement(['Best Case', 'Worst Case', 'Realistic', null]),
            'current_cgpa' => $currentCgpa,
            'current_credit_hours' => fake()->numberBetween(15, 120),
            'projected_grades' => [
                ['course' => 'CSC 301', 'units' => 3, 'grade' => 'A'],
                ['course' => 'CSC 303', 'units' => 3, 'grade' => 'B'],
            ],
            'projected_cgpa' => fake()->randomFloat(2, 1.00, 5.00),
        ];
    }
}
