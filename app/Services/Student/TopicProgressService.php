<?php

namespace App\Services\Student;

use App\Models\BlockCompletion;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\TopicCompletion;
use App\Models\User;

class TopicProgressService
{
    public function toggleTopicCompletion(User $user, CanonicalTopic $topic): bool
    {
        $existing = TopicCompletion::query()
            ->where('user_id', $user->id)
            ->where('canonical_topic_id', $topic->id)
            ->first();

        if ($existing) {
            $existing->delete();

            return false;
        }

        TopicCompletion::query()->create([
            'user_id' => $user->id,
            'canonical_topic_id' => $topic->id,
            'completed_at' => now(),
        ]);

        return true;
    }

    public function toggleBlockCompletion(User $user, ContentBlock $block, int $readingTimeSeconds): bool
    {
        $existing = BlockCompletion::query()
            ->where('user_id', $user->id)
            ->where('content_block_id', $block->id)
            ->first();

        if ($existing) {
            $existing->delete();

            return false;
        }

        BlockCompletion::query()->create([
            'user_id' => $user->id,
            'content_block_id' => $block->id,
            'completed_at' => now(),
            'reading_time_seconds' => $readingTimeSeconds,
        ]);

        return true;
    }
}
