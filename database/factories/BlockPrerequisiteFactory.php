<?php

namespace Database\Factories;

use App\Models\ContentBlock;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\BlockPrerequisite>
 */
class BlockPrerequisiteFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'block_id' => ContentBlock::factory(),
            'prerequisite_block_id' => ContentBlock::factory(),
            'is_hard_prerequisite' => true,
        ];
    }

    public function soft(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_hard_prerequisite' => false,
        ]);
    }
}
