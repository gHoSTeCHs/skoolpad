<?php

namespace Database\Factories;

use App\Enums\VerificationResult;
use App\Models\CanonicalTopic;
use App\Models\ParentChildLink;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\VerificationAttempt>
 */
class VerificationAttemptFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'parent_child_link_id' => ParentChildLink::factory(),
            'canonical_topic_id' => CanonicalTopic::factory(),
            'responses' => [
                'explain_checklist' => ['concepts_checked' => [0, 1, 2], 'concepts_total' => 5],
                'true_false' => [
                    ['index' => 0, 'child_answer' => true, 'correct' => true],
                    ['index' => 1, 'child_answer' => false, 'correct' => false],
                ],
            ],
            'overall_result' => fake()->randomElement(VerificationResult::cases()),
            'notes' => fake()->optional()->sentence(),
        ];
    }

    public function understood(): static
    {
        return $this->state(fn (array $attributes) => [
            'overall_result' => VerificationResult::Understood,
        ]);
    }

    public function needsReview(): static
    {
        return $this->state(fn (array $attributes) => [
            'overall_result' => VerificationResult::NeedsReview,
        ]);
    }
}
