<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PlatformSetting>
 */
class PlatformSettingFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'key' => fake()->unique()->slug(2),
            'value' => ['enabled' => true],
            'updated_by' => User::factory(),
        ];
    }
}
