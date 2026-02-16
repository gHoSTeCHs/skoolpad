<?php

namespace Database\Factories;

use App\Models\Faculty;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Department>
 */
class DepartmentFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $departments = [
            ['name' => 'Computer Science', 'abbreviation' => 'CSC'],
            ['name' => 'Mechanical Engineering', 'abbreviation' => 'MEE'],
            ['name' => 'Electrical Engineering', 'abbreviation' => 'EEE'],
            ['name' => 'Civil Engineering', 'abbreviation' => 'CVE'],
            ['name' => 'Mass Communication', 'abbreviation' => 'MCM'],
            ['name' => 'Economics', 'abbreviation' => 'ECO'],
            ['name' => 'Accounting', 'abbreviation' => 'ACC'],
            ['name' => 'Mathematics', 'abbreviation' => 'MTH'],
            ['name' => 'Physics', 'abbreviation' => 'PHY'],
            ['name' => 'Chemistry', 'abbreviation' => 'CHM'],
        ];

        $pick = fake()->randomElement($departments);

        return [
            'faculty_id' => Faculty::factory(),
            'name' => $pick['name'],
            'abbreviation' => $pick['abbreviation'],
        ];
    }
}
