<?php

namespace Database\Factories;

use App\Enums\ContentSubmissionStatus;
use App\Enums\ContentSubmissionType;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ContentSubmission>
 */
class ContentSubmissionFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'submitted_by' => User::factory(),
            'submission_type' => fake()->randomElement(ContentSubmissionType::cases()),
            'related_question_id' => null,
            'related_topic_id' => null,
            'content' => [['type' => 'text', 'value' => fake()->paragraph()]],
            'images' => null,
            'institution_course_id' => null,
            'exam_year' => fake()->numberBetween(2018, 2025),
            'exam_semester' => null,
            'status' => ContentSubmissionStatus::Pending,
            'reviewer_id' => null,
            'reviewer_notes' => null,
            'reviewed_at' => null,
        ];
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ContentSubmissionStatus::Approved,
            'reviewer_id' => User::factory(),
            'reviewed_at' => now(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ContentSubmissionStatus::Rejected,
            'reviewer_id' => User::factory(),
            'reviewer_notes' => fake()->sentence(),
            'reviewed_at' => now(),
        ]);
    }
}
