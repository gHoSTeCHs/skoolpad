<?php

namespace Database\Factories;

use App\Models\InstitutionCourse;
use App\Models\LevelSubject;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ExamTimetableEntry>
 */
class ExamTimetableEntryFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'institution_course_id' => null,
            'level_subject_id' => null,
            'assessment_type_id' => null,
            'label' => fake()->sentence(3),
            'exam_date' => fake()->dateTimeBetween('+1 week', '+3 months'),
            'exam_time' => fake()->time('H:i'),
            'notes' => null,
            'is_completed' => false,
            'completed_at' => null,
        ];
    }

    public function withCourse(): static
    {
        return $this->state(fn () => [
            'institution_course_id' => InstitutionCourse::factory(),
        ]);
    }

    public function withLevelSubject(): static
    {
        return $this->state(fn () => [
            'level_subject_id' => LevelSubject::factory(),
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn () => [
            'is_completed' => true,
            'completed_at' => now(),
        ]);
    }

    public function past(): static
    {
        return $this->state(fn () => [
            'exam_date' => fake()->dateTimeBetween('-3 months', '-1 day'),
        ]);
    }

    public function imminent(): static
    {
        return $this->state(fn () => [
            'exam_date' => now()->addDays(fake()->numberBetween(0, 2)),
        ]);
    }
}
