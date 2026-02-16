<?php

namespace Database\Factories;

use App\Models\StudyGroup;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\StudyGroupMember>
 */
class StudyGroupMemberFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'study_group_id' => StudyGroup::factory(),
            'user_id' => User::factory(),
            'joined_at' => now(),
        ];
    }
}
