<?php

namespace Database\Factories;

use App\Models\Discipline;
use App\Models\EducationSystem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CurriculumSubject>
 */
class CurriculumSubjectFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);

        return [
            'education_system_id' => EducationSystem::factory(),
            'name' => $name,
            'slug' => \Illuminate\Support\Str::slug($name),
            'discipline_id' => Discipline::factory(),
        ];
    }
}
