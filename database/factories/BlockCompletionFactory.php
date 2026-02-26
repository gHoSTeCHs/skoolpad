<?php

namespace Database\Factories;

use App\Models\ContentBlock;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\BlockCompletion> */
class BlockCompletionFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'content_block_id' => ContentBlock::factory(),
            'completed_at' => now(),
        ];
    }
}
