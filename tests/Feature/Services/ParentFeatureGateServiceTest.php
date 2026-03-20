<?php

use App\Models\User;
use App\Models\UserSubscription;
use App\Services\ParentFeatureGateService;

beforeEach(function () {
    $this->service = new ParentFeatureGateService;
});

test('all features unlocked when monetization is disabled', function () {
    config(['skoolpad.monetization_enabled' => false]);
    $user = User::factory()->parent()->create();

    expect($this->service->isPremium($user))->toBeTrue();
    expect($this->service->canAccessWeeklyReport($user))->toBeTrue();
    expect($this->service->canAccessExamAlerts($user))->toBeTrue();
    expect($this->service->canAccessVerification($user))->toBeTrue();
    expect($this->service->canAccessReadTogether($user))->toBeTrue();
    expect($this->service->canAccessStudyAsChild($user))->toBeTrue();
    expect($this->service->canAccessFullDashboard($user))->toBeTrue();
    expect($this->service->getCheckInTopicLimit($user))->toBe(PHP_INT_MAX);
});

test('free user restricted when monetization is enabled', function () {
    config(['skoolpad.monetization_enabled' => true]);
    $user = User::factory()->parent()->create();

    expect($this->service->isPremium($user))->toBeFalse();
    expect($this->service->canAccessWeeklyReport($user))->toBeFalse();
    expect($this->service->canAccessExamAlerts($user))->toBeFalse();
    expect($this->service->canAccessVerification($user))->toBeFalse();
    expect($this->service->getCheckInTopicLimit($user))->toBe(1);
    expect($this->service->getSubscriptionStatus($user))->toBe('free');
});

test('premium user has full access when monetization is enabled', function () {
    config(['skoolpad.monetization_enabled' => true]);
    $user = User::factory()->parent()->create();

    UserSubscription::factory()->create([
        'user_id' => $user->id,
        'status' => 'active',
    ]);

    expect($this->service->isPremium($user))->toBeTrue();
    expect($this->service->canAccessWeeklyReport($user))->toBeTrue();
    expect($this->service->canAccessExamAlerts($user))->toBeTrue();
    expect($this->service->canAccessVerification($user))->toBeTrue();
    expect($this->service->getCheckInTopicLimit($user))->toBe(PHP_INT_MAX);
});

test('getSubscriptionStatus returns all_access when monetization disabled', function () {
    config(['skoolpad.monetization_enabled' => false]);
    $user = User::factory()->parent()->create();

    expect($this->service->getSubscriptionStatus($user))->toBe('all_access');
});

test('getFeatureMatrix returns correct shape', function () {
    config(['skoolpad.monetization_enabled' => false]);
    $user = User::factory()->parent()->create();

    $matrix = $this->service->getFeatureMatrix($user);

    expect($matrix)->toHaveKeys([
        'is_premium', 'full_dashboard', 'verification', 'read_together',
        'study_as_child', 'weekly_report', 'exam_alerts', 'full_check_in',
        'check_in_topic_limit',
    ]);
    expect($matrix['is_premium'])->toBeTrue();
});

test('getFeatureMatrix reflects free tier when monetization enabled', function () {
    config(['skoolpad.monetization_enabled' => true]);
    $user = User::factory()->parent()->create();

    $matrix = $this->service->getFeatureMatrix($user);

    expect($matrix['is_premium'])->toBeFalse();
    expect($matrix['verification'])->toBeFalse();
    expect($matrix['check_in_topic_limit'])->toBe(1);
});
