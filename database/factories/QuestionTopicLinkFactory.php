<?php

namespace Database\Factories;

use App\Models\CanonicalTopic;
use App\Models\Question;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\QuestionTopicLink>
 */
class QuestionTopicLinkFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'question_id' => Question::factory(),
            'canonical_topic_id' => CanonicalTopic::factory(),
            'is_primary' => true,
        ];
    }
}
