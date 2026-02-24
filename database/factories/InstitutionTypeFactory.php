<?php

namespace Database\Factories;

use App\Models\Country;
use App\Models\GradingScale;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\InstitutionType>
 */
class InstitutionTypeFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $name = fake()->randomElement(['University', 'Polytechnic', 'College of Education', 'Community College']);

        return [
            'country_id' => Country::factory(),
            'name' => $name,
            'slug' => \Illuminate\Support\Str::slug($name),
            'level_progression' => ['100L', '200L', '300L', '400L'],
            'credit_system' => 'Credit Units',
            'grading_scale_id' => GradingScale::factory(),
            'qualification_names' => ['B.Sc.', 'B.A.', 'B.Eng.'],
        ];
    }
}
