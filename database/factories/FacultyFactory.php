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
            ['name' => 'College of Physical and Applied Sciences', 'abbreviation' => 'COLPAS'],
            ['name' => 'College of Engineering', 'abbreviation' => 'COLENG'],
            ['name' => 'Faculty of Science', 'abbreviation' => 'FSC'],
            ['name' => 'Faculty of Arts', 'abbreviation' => 'FARTS'],
            ['name' => 'Faculty of Social Sciences', 'abbreviation' => 'FSSC'],
            ['name' => 'Faculty of Management Sciences', 'abbreviation' => 'FMS'],
            ['name' => 'Faculty of Education', 'abbreviation' => 'FED'],
            ['name' => 'Faculty of Law', 'abbreviation' => 'FLAW'],
        ];

        $pick = fake()->randomElement($faculties);

        return [
            'institution_id' => Institution::factory(),
            'name' => $pick['name'],
            'abbreviation' => $pick['abbreviation'],
        ];
    }
}
