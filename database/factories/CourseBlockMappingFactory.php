<?php

namespace Database\Factories;

use App\Enums\TeachingDepth;
use App\Models\ContentBlock;
use App\Models\InstitutionCourse;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CourseBlockMapping>
 */
class CourseBlockMappingFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'institution_course_id' => InstitutionCourse::factory(),
            'curriculum_subject_level_id' => null,
            'content_block_id' => ContentBlock::factory(),
            'teaching_depth' => fake()->randomElement(TeachingDepth::cases()),
            'is_core_block' => true,
            'week_start' => null,
            'week_end' => null,
            'lecture_hours' => null,
            'lab_hours' => null,
        ];
    }

    public function forLevelSubject(): static
    {
        return $this->state(fn (array $attributes) => [
            'institution_course_id' => null,
            'curriculum_subject_level_id' => \App\Models\LevelSubject::factory(),
        ]);
    }

    public function supplementary(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_core_block' => false,
        ]);
    }
}
