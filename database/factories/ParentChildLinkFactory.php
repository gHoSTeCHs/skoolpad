<?php

namespace Database\Factories;

use App\Enums\ParentChildLinkStatus;
use App\Models\ParentProfile;
use App\Models\StudentProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ParentChildLink>
 */
class ParentChildLinkFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'parent_profile_id' => ParentProfile::factory(),
            'student_profile_id' => StudentProfile::factory(),
            'status' => ParentChildLinkStatus::Pending,
            'linked_at' => null,
            'data_consent_granted_at' => null,
            'study_goal_minutes' => null,
        ];
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ParentChildLinkStatus::Active,
            'linked_at' => now(),
            'data_consent_granted_at' => now(),
        ]);
    }

    public function withStudyGoal(int $minutes = 30): static
    {
        return $this->state(fn (array $attributes) => [
            'study_goal_minutes' => $minutes,
        ]);
    }
}
