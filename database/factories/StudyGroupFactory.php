<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\StudyGroup>
 */
class StudyGroupFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(['CSC 301 Study Group', 'JAMB Prep Squad', 'Engineering Gang', 'Exam Warriors']),
            'owner_id' => User::factory(),
            'subscription_id' => null,
            'max_members' => fake()->randomElement([5, 10, 15]),
            'invite_code' => Str::upper(Str::random(8)),
        ];
    }
}
