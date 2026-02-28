<?php

namespace Database\Factories;

use App\Enums\CourseScope;
use App\Enums\Semester;
use App\Models\Department;
use App\Models\Discipline;
use App\Models\Institution;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\InstitutionCourse>
 */
class InstitutionCourseFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $prefixes = ['CSC', 'ENG', 'MEE', 'PHY', 'MTH', 'CHM', 'ECO', 'ACC'];
        $prefix = fake()->randomElement($prefixes);
        $level = fake()->randomElement(['100L', '200L', '300L', '400L', '500L']);
        $courseNumber = ((int) $level / 100) * 100 + fake()->unique()->numberBetween(1, 99);

        $titles = [
            'CSC' => ['Introduction to Computing', 'Data Structures', 'Operating Systems', 'Software Engineering'],
            'ENG' => ['Communication Skills', 'Technical Writing', 'Literature in English'],
            'MEE' => ['Engineering Mechanics', 'Thermodynamics', 'Fluid Mechanics'],
            'PHY' => ['Mechanics and Properties of Matter', 'Electricity and Magnetism', 'Optics'],
            'MTH' => ['Calculus', 'Linear Algebra', 'Differential Equations', 'Statistics'],
            'CHM' => ['General Chemistry', 'Organic Chemistry', 'Physical Chemistry'],
            'ECO' => ['Microeconomics', 'Macroeconomics', 'Development Economics'],
            'ACC' => ['Financial Accounting', 'Cost Accounting', 'Auditing'],
        ];

        return [
            'institution_id' => Institution::factory(),
            'owning_department_id' => Department::factory(),
            'discipline_id' => Discipline::factory(),
            'course_code' => $prefix.' '.$courseNumber,
            'course_title' => fake()->randomElement($titles[$prefix]),
            'level' => $level,
            'semester' => fake()->randomElement(Semester::cases()),
            'credit_units' => fake()->randomElement([2, 3, 4]),
            'is_elective' => fake()->boolean(20),
            'course_scope' => CourseScope::Department,
            'description' => null,
        ];
    }
}
