<?php

namespace Database\Factories;

use App\Models\Institution;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Faculty>
 */
class FacultyFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $faculties = [
            'College of Physical and Applied Sciences',
            'College of Engineering',
            'Faculty of Science',
            'Faculty of Arts',
            'Faculty of Social Sciences',
            'Faculty of Management Sciences',
            'Faculty of Education',
            'Faculty of Law',
            'Faculty of Agriculture',
            'Faculty of Environmental Sciences',
            'Faculty of Medicine',
            'Faculty of Pharmacy',
        ];

        $name = fake()->unique()->randomElement($faculties);

        return [
            'institution_id' => Institution::factory(),
            'name' => $name,
            'abbreviation' => strtoupper(collect(explode(' ', $name))->map(fn ($w) => $w[0])->join('')),
        ];
    }
}
