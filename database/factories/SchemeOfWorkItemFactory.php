<?php

namespace Database\Factories;

use App\Models\LevelSubject;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SchemeOfWorkItem>
 */
class SchemeOfWorkItemFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'curriculum_subject_level_id' => LevelSubject::factory(),
            'term' => fake()->numberBetween(1, 3),
            'week_number' => fake()->numberBetween(1, 13),
            'topic_label' => fake()->sentence(3),
            'canonical_topic_id' => null,
            'content_block_id' => null,
        ];
    }
}
