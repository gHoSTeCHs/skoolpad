<?php

namespace Database\Factories;

use App\Enums\ParentalRelationship;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ParentProfile>
 */
class ParentProfileFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'phone_number' => fake()->phoneNumber(),
            'relationship' => fake()->randomElement(ParentalRelationship::cases()),
            'notification_preferences' => [],
        ];
    }
}
