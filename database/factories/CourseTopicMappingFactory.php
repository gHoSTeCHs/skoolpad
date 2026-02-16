<?php

namespace Database\Factories;

use App\Enums\TopicWeight;
use App\Models\CanonicalTopic;
use App\Models\InstitutionCourse;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CourseTopicMapping>
 */
class CourseTopicMappingFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'institution_course_id' => InstitutionCourse::factory(),
            'canonical_topic_id' => CanonicalTopic::factory(),
            'sequence_order' => fake()->numberBetween(1, 20),
            'weight' => TopicWeight::Core,
        ];
    }
}
