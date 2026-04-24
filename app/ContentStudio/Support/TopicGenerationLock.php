<?php

namespace App\ContentStudio\Support;

use Illuminate\Support\Facades\Cache;

final class TopicGenerationLock
{
    private const TTL_SECONDS = 3600;

    public static function acquire(string $topicId): bool
    {
        return Cache::add(self::key($topicId), 1, self::TTL_SECONDS);
    }

    public static function release(string $topicId): void
    {
        Cache::forget(self::key($topicId));
    }

    public static function isHeld(string $topicId): bool
    {
        return Cache::has(self::key($topicId));
    }

    public static function key(string $topicId): string
    {
        return "content_studio.topic_generating.{$topicId}";
    }
}
