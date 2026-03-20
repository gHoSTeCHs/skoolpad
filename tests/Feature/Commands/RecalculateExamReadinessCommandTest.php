<?php

use App\Models\ExamReadinessCache;
use App\Models\LevelSubject;
use App\Models\StudentProfile;

test('command processes secondary students with existing cache entries', function () {
    $profile = StudentProfile::factory()->secondary()->create();
    $levelSubject = LevelSubject::factory()->create();

    ExamReadinessCache::factory()->create([
        'user_id' => $profile->user_id,
        'curriculum_subject_level_id' => $levelSubject->id,
        'composite_score' => 50,
    ]);

    $this->artisan('parent:recalculate-readiness')
        ->assertSuccessful();

    $cache = ExamReadinessCache::query()
        ->where('user_id', $profile->user_id)
        ->where('curriculum_subject_level_id', $levelSubject->id)
        ->first();

    expect($cache->calculated_at->isToday())->toBeTrue();
});

test('command skips tertiary students', function () {
    $profile = StudentProfile::factory()->create();
    $levelSubject = LevelSubject::factory()->create();

    ExamReadinessCache::factory()->create([
        'user_id' => $profile->user_id,
        'curriculum_subject_level_id' => $levelSubject->id,
        'calculated_at' => now()->subDay(),
    ]);

    $this->artisan('parent:recalculate-readiness')
        ->assertSuccessful();

    $cache = ExamReadinessCache::query()
        ->where('user_id', $profile->user_id)
        ->first();

    expect($cache->calculated_at->isToday())->toBeFalse();
});

test('command handles errors gracefully', function () {
    $profile1 = StudentProfile::factory()->secondary()->create();
    $profile2 = StudentProfile::factory()->secondary()->create();
    $ls = LevelSubject::factory()->create();

    ExamReadinessCache::factory()->create([
        'user_id' => $profile2->user_id,
        'curriculum_subject_level_id' => $ls->id,
    ]);

    $this->artisan('parent:recalculate-readiness')
        ->assertSuccessful();
});
