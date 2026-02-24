<?php

namespace Database\Factories;

use App\Models\CurriculumSubject;
use App\Models\EducationLevel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\LevelSubject>
 */
class LevelSubjectFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'education_level_id' => EducationLevel::factory(),
            'curriculum_subject_id' => CurriculumSubject::factory(),
            'is_compulsory' => true,
            'stream_id' => null,
        ];
    }

    public function optional(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_compulsory' => false,
        ]);
    }
}
