<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\StudentNote>
 */
class StudentNoteFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'canonical_topic_id' => null,
            'institution_course_id' => null,
            'title' => fake()->sentence(4),
            'content' => [['type' => 'paragraph', 'text' => fake()->paragraph()]],
            'is_pinned' => false,
        ];
    }

    public function pinned(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_pinned' => true,
        ]);
    }
}
