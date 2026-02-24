<?php

namespace Database\Factories;

use App\Enums\ScaleType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\GradingScale>
 */
class GradingScaleFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(3, true),
            'scale_type' => fake()->randomElement(ScaleType::cases()),
            'scale_min' => 0,
            'scale_max' => 100,
            'pass_threshold' => 40,
            'grade_boundaries' => [
                ['label' => 'A', 'min' => 70, 'max' => 100, 'is_pass' => true],
                ['label' => 'B', 'min' => 60, 'max' => 69, 'is_pass' => true],
                ['label' => 'C', 'min' => 50, 'max' => 59, 'is_pass' => true],
                ['label' => 'D', 'min' => 40, 'max' => 49, 'is_pass' => true],
                ['label' => 'F', 'min' => 0, 'max' => 39, 'is_pass' => false],
            ],
            'classification_labels' => null,
        ];
    }

    public function cgpa(): static
    {
        return $this->state(fn (array $attributes) => [
            'scale_type' => ScaleType::Cgpa,
            'scale_min' => 0,
            'scale_max' => 5,
            'pass_threshold' => 1,
            'grade_boundaries' => [
                ['label' => 'A', 'min' => 4.5, 'max' => 5.0, 'is_pass' => true],
                ['label' => 'B', 'min' => 3.5, 'max' => 4.49, 'is_pass' => true],
                ['label' => 'C', 'min' => 2.4, 'max' => 3.49, 'is_pass' => true],
                ['label' => 'D', 'min' => 1.5, 'max' => 2.39, 'is_pass' => true],
                ['label' => 'E', 'min' => 1.0, 'max' => 1.49, 'is_pass' => true],
                ['label' => 'F', 'min' => 0, 'max' => 0.99, 'is_pass' => false],
            ],
            'classification_labels' => [
                ['label' => 'First Class', 'min_cgpa' => 4.5],
                ['label' => 'Second Class Upper', 'min_cgpa' => 3.5],
                ['label' => 'Second Class Lower', 'min_cgpa' => 2.4],
                ['label' => 'Third Class', 'min_cgpa' => 1.5],
                ['label' => 'Pass', 'min_cgpa' => 1.0],
            ],
        ]);
    }
}
