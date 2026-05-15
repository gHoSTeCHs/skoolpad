<?php

namespace Database\Factories;

use App\Models\AssessmentSubject;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ExamSyllabusTopic>
 */
class ExamSyllabusTopicFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'assessment_subject_id' => AssessmentSubject::factory(),
            'parent_topic_id' => null,
            'part_label' => fake()->optional()->randomElement(['Section 1: Mechanics', 'Section 2: Heat', 'Paper 2']),
            'topic_number' => fake()->numerify('#.#'),
            'title' => fake()->sentence(4),
            'notes_md' => fake()->paragraph(),
            'subtopics_json' => [
                ['title' => fake()->sentence(3)],
                ['title' => fake()->sentence(3)],
            ],
            'source_url' => fake()->url(),
            'version_year' => fake()->numberBetween(2020, 2026),
            'ingested_at' => now(),
        ];
    }
}
