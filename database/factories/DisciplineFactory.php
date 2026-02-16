<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Discipline>
 */
class DisciplineFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $name = fake()->unique()->randomElement([
            'Computer Science',
            'Mathematics',
            'Physics',
            'Chemistry',
            'Biology',
            'English Language',
            'Mechanical Engineering',
            'Electrical Engineering',
            'Civil Engineering',
            'Economics',
            'Accounting',
            'Mass Communication',
            'Political Science',
            'Philosophy',
            'Microbiology',
        ]);

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => fake()->sentence(),
            'icon' => null,
        ];
    }
}
