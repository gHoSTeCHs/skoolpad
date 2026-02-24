<?php

namespace Database\Factories;

use App\Models\EducationSystem;
use App\Models\GradingScale;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AssessmentType>
 */
class AssessmentTypeFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);

        return [
            'education_system_id' => EducationSystem::factory(),
            'name' => $name,
            'slug' => \Illuminate\Support\Str::slug($name),
            'tier_id' => null,
            'is_exit_exam' => false,
            'is_entrance_exam' => false,
            'grading_scale_id' => GradingScale::factory(),
        ];
    }

    public function exitExam(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_exit_exam' => true,
        ]);
    }

    public function entranceExam(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_entrance_exam' => true,
        ]);
    }
}
