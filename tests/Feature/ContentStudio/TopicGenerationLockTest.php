<?php

use App\ContentStudio\Support\TopicGenerationLock;
use Illuminate\Support\Str;

it('first acquire succeeds, second fails while held', function () {
    $topicId = (string) Str::uuid();

    expect(TopicGenerationLock::acquire($topicId))->toBeTrue()
        ->and(TopicGenerationLock::acquire($topicId))->toBeFalse();

    TopicGenerationLock::release($topicId);
});

it('release frees the lock for subsequent acquire', function () {
    $topicId = (string) Str::uuid();

    TopicGenerationLock::acquire($topicId);
    TopicGenerationLock::release($topicId);

    expect(TopicGenerationLock::acquire($topicId))->toBeTrue();

    TopicGenerationLock::release($topicId);
});

it('different topic ids do not block each other', function () {
    $t1 = (string) Str::uuid();
    $t2 = (string) Str::uuid();

    TopicGenerationLock::acquire($t1);
    expect(TopicGenerationLock::acquire($t2))->toBeTrue();

    TopicGenerationLock::release($t1);
    TopicGenerationLock::release($t2);
});
