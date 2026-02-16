<?php

namespace Database\Factories;

use App\Models\Department;
use App\Models\InstitutionCourse;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CourseDepartmentOffering>
 */
class CourseDepartmentOfferingFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'institution_course_id' => InstitutionCourse::factory(),
            'department_id' => Department::factory(),
            'is_compulsory' => true,
        ];
    }

    public function elective(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_compulsory' => false,
        ]);
    }
}
