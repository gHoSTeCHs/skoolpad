<?php

use App\Models\CurriculumTier;
use App\Models\EducationLevel;
use App\Models\EducationSystem;
use App\Models\ParentChildLink;
use App\Models\PracticeSession;
use App\Models\StudentProfile;
use App\Models\User;
use App\Models\UserLevel;
use App\Services\ParentEngagementService;

beforeEach(function () {
    $this->service = new ParentEngagementService;
});

function createSecondaryStudentWithLevel(int $sortOrder = 1): array
{
    $educationSystem = EducationSystem::factory()->create();
    $tier = CurriculumTier::factory()->for($educationSystem)->create(['is_tertiary' => false]);
    $level = EducationLevel::factory()->for($tier, 'curriculumTier')->create(['sort_order' => $sortOrder]);

    $user = User::factory()->create();
    $profile = StudentProfile::factory()->secondary()->create([
        'user_id' => $user->id,
        'education_level_id' => $level->id,
    ]);

    return [$user, $profile];
}

it('returns null for tertiary students', function () {
    $user = User::factory()->create();
    $profile = StudentProfile::factory()->create(['user_id' => $user->id]);

    $result = $this->service->shouldShowInvitePrompt($user, $profile);

    expect($result)->toBeNull();
});

it('returns null when parent already linked with active status', function () {
    [$user, $profile] = createSecondaryStudentWithLevel();

    ParentChildLink::factory()->active()->create([
        'student_profile_id' => $profile->id,
    ]);

    $result = $this->service->shouldShowInvitePrompt($user, $profile);

    expect($result)->toBeNull();
});

it('returns null when parent already linked with pending status', function () {
    [$user, $profile] = createSecondaryStudentWithLevel();

    ParentChildLink::factory()->create([
        'student_profile_id' => $profile->id,
    ]);

    $result = $this->service->shouldShowInvitePrompt($user, $profile);

    expect($result)->toBeNull();
});

it('returns null when dismissed for non-early-level students', function () {
    [$user, $profile] = createSecondaryStudentWithLevel(sortOrder: 5);

    $profile->update(['parent_invite_dismissed_at' => now()->subDay()]);

    $result = $this->service->shouldShowInvitePrompt($user, $profile);

    expect($result)->toBeNull();
});

it('re-shows after 7 days for early-level dismissed students', function () {
    [$user, $profile] = createSecondaryStudentWithLevel(sortOrder: 2);

    $profile->update(['parent_invite_dismissed_at' => now()->subDays(8)]);

    UserLevel::factory()->create([
        'user_id' => $user->id,
        'streak_days' => 3,
    ]);

    $result = $this->service->shouldShowInvitePrompt($user, $profile);

    expect($result)->not->toBeNull()
        ->and($result['show'])->toBeTrue()
        ->and($result['trigger'])->toBe('three_day_streak');
});

it('remains dismissed within 7 days for early-level students', function () {
    [$user, $profile] = createSecondaryStudentWithLevel(sortOrder: 1);

    $profile->update(['parent_invite_dismissed_at' => now()->subDays(3)]);

    UserLevel::factory()->create([
        'user_id' => $user->id,
        'streak_days' => 5,
    ]);

    $result = $this->service->shouldShowInvitePrompt($user, $profile);

    expect($result)->toBeNull();
});

it('detects first_practice_above_60 trigger', function () {
    [$user, $profile] = createSecondaryStudentWithLevel();

    PracticeSession::factory()->completed()->create([
        'user_id' => $user->id,
        'score_percentage' => 65,
    ]);

    $result = $this->service->shouldShowInvitePrompt($user, $profile);

    expect($result)->not->toBeNull()
        ->and($result['trigger'])->toBe('first_practice_above_60');
});

it('detects high_score trigger', function () {
    [$user, $profile] = createSecondaryStudentWithLevel();

    PracticeSession::factory()->completed()->create([
        'user_id' => $user->id,
        'score_percentage' => 50,
        'completed_at' => now()->subHour(),
    ]);

    PracticeSession::factory()->completed()->create([
        'user_id' => $user->id,
        'score_percentage' => 85,
        'completed_at' => now(),
    ]);

    $result = $this->service->shouldShowInvitePrompt($user, $profile);

    expect($result)->not->toBeNull()
        ->and($result['trigger'])->toBe('high_score');
});

it('detects three_day_streak trigger', function () {
    [$user, $profile] = createSecondaryStudentWithLevel();

    PracticeSession::factory()->completed()->create([
        'user_id' => $user->id,
        'score_percentage' => 40,
    ]);

    UserLevel::factory()->create([
        'user_id' => $user->id,
        'streak_days' => 3,
    ]);

    $result = $this->service->shouldShowInvitePrompt($user, $profile);

    expect($result)->not->toBeNull()
        ->and($result['trigger'])->toBe('three_day_streak');
});

it('detects consistent_first_week trigger', function () {
    [$user, $profile] = createSecondaryStudentWithLevel();

    PracticeSession::factory()->completed()->create([
        'user_id' => $user->id,
        'score_percentage' => 40,
        'completed_at' => now()->subDays(10),
    ]);

    PracticeSession::factory()->completed()->count(3)->create([
        'user_id' => $user->id,
        'score_percentage' => 45,
        'completed_at' => now()->subDay(),
    ]);

    $result = $this->service->shouldShowInvitePrompt($user, $profile);

    expect($result)->not->toBeNull()
        ->and($result['trigger'])->toBe('consistent_first_week');
});

it('returns null when no trigger is detected', function () {
    [$user, $profile] = createSecondaryStudentWithLevel();

    $result = $this->service->shouldShowInvitePrompt($user, $profile);

    expect($result)->toBeNull();
});

it('returns prominent style for early-level students and subtle for higher-level', function () {
    [$earlyUser, $earlyProfile] = createSecondaryStudentWithLevel(sortOrder: 1);
    [$laterUser, $laterProfile] = createSecondaryStudentWithLevel(sortOrder: 4);

    UserLevel::factory()->create([
        'user_id' => $earlyUser->id,
        'streak_days' => 5,
    ]);

    UserLevel::factory()->create([
        'user_id' => $laterUser->id,
        'streak_days' => 5,
    ]);

    $earlyResult = $this->service->shouldShowInvitePrompt($earlyUser, $earlyProfile);
    $laterResult = $this->service->shouldShowInvitePrompt($laterUser, $laterProfile);

    expect($earlyResult)->not->toBeNull()
        ->and($earlyResult['style'])->toBe('prominent')
        ->and($earlyResult['is_early_level'])->toBeTrue()
        ->and($laterResult)->not->toBeNull()
        ->and($laterResult['style'])->toBe('subtle')
        ->and($laterResult['is_early_level'])->toBeFalse();
});
