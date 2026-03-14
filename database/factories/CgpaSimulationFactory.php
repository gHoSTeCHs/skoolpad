<?php

namespace Database\Factories;

use App\Models\GradingScale;
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
            'mode' => 'quick',
            'grading_scale_id' => null,
            'current_cgpa' => $currentCgpa,
            'current_credit_hours' => fake()->numberBetween(15, 120),
            'projected_grades' => [
                ['course_code' => 'CSC 301', 'credit_units' => 3, 'grade' => 'A'],
                ['course_code' => 'CSC 303', 'credit_units' => 3, 'grade' => 'B'],
            ],
            'projected_cgpa' => fake()->randomFloat(2, 1.00, 5.00),
            'semester_data' => null,
            'target_cgpa' => null,
        ];
    }

    public function quick(): static
    {
        return $this->state(fn () => ['mode' => 'quick', 'semester_data' => null]);
    }

    public function detailed(): static
    {
        return $this->state(fn () => [
            'mode' => 'detailed',
            'semester_data' => [
                [
                    'level' => '100L',
                    'semester' => 'First',
                    'courses' => [
                        ['course_code' => 'GST 101', 'credit_units' => 2, 'grade' => 'A'],
                        ['course_code' => 'CSC 101', 'credit_units' => 3, 'grade' => 'B'],
                    ],
                ],
            ],
        ]);
    }

    public function withScale(GradingScale $scale): static
    {
        return $this->state(fn () => ['grading_scale_id' => $scale->id]);
    }
}
