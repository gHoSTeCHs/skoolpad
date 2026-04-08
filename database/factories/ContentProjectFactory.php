<?php

namespace Database\Factories;

use App\Enums\ContentProjectMode;
use App\Enums\ContentProjectStatus;
use App\Models\CurriculumSubject;
use App\Models\Discipline;
use App\Models\EducationLevel;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ContentProject>
 */
class ContentProjectFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'mode' => ContentProjectMode::Secondary,
            'education_level_id' => EducationLevel::factory(),
            'curriculum_subject_id' => CurriculumSubject::factory(),
            'discipline_id' => null,
            'status' => ContentProjectStatus::Draft,
            'created_by' => User::factory(),
            'progress_data' => null,
            'ai_context' => null,
        ];
    }

    public function secondary(): static
    {
        return $this->state(fn (array $attributes) => [
            'mode' => ContentProjectMode::Secondary,
            'education_level_id' => EducationLevel::factory(),
            'curriculum_subject_id' => CurriculumSubject::factory(),
            'discipline_id' => null,
        ]);
    }

    public function tertiary(): static
    {
        return $this->state(fn (array $attributes) => [
            'mode' => ContentProjectMode::Tertiary,
            'education_level_id' => null,
            'curriculum_subject_id' => null,
            'discipline_id' => Discipline::factory(),
        ]);
    }

    public function withStatus(ContentProjectStatus $status): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => $status,
        ]);
    }
}
