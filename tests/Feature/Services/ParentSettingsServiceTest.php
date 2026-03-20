<?php

use App\Models\ParentChildLink;
use App\Models\ParentProfile;
use App\Services\ParentSettingsService;

beforeEach(function () {
    $this->service = new ParentSettingsService;
    $this->parentProfile = ParentProfile::factory()->create([
        'notification_preferences' => ['alert_channels' => ['email', 'in_app']],
    ]);
});

test('getSettings returns notification preferences and children settings', function () {
    $link = ParentChildLink::factory()->active()->withStudyGoal(30)->create([
        'parent_profile_id' => $this->parentProfile->id,
    ]);

    $settings = $this->service->getSettings($this->parentProfile);

    expect($settings)->toHaveKeys(['notification_preferences', 'children_settings']);
    expect($settings['notification_preferences'])->toBe(['alert_channels' => ['email', 'in_app']]);
    expect($settings['children_settings'])->toHaveCount(1);
    expect($settings['children_settings'][0])->toHaveKeys(['link_id', 'child_name', 'study_goal_minutes', 'current_term', 'term_start_date']);
    expect($settings['children_settings'][0]['study_goal_minutes'])->toBe(30);
});

test('getSettings returns empty children settings when no active links', function () {
    ParentChildLink::factory()->create([
        'parent_profile_id' => $this->parentProfile->id,
    ]);

    $settings = $this->service->getSettings($this->parentProfile);

    expect($settings['children_settings'])->toBeEmpty();
});

test('updateNotificationPreferences updates and returns refreshed profile', function () {
    $newPreferences = ['alert_channels' => ['sms', 'email'], 'frequency' => 'daily'];

    $updated = $this->service->updateNotificationPreferences($this->parentProfile, $newPreferences);

    expect($updated->notification_preferences)->toMatchArray($newPreferences);
    expect($updated->notification_preferences)->toHaveCount(2);
});

test('updateNotificationPreferences preserves other profile fields', function () {
    $originalPhone = $this->parentProfile->phone_number;

    $this->service->updateNotificationPreferences($this->parentProfile, ['new' => 'prefs']);

    $this->parentProfile->refresh();
    expect($this->parentProfile->phone_number)->toBe($originalPhone);
    expect($this->parentProfile->notification_preferences)->toBe(['new' => 'prefs']);
});

test('updateChildStudyDuration updates minutes on owned link', function () {
    $link = ParentChildLink::factory()->active()->create([
        'parent_profile_id' => $this->parentProfile->id,
    ]);

    $updated = $this->service->updateChildStudyDuration($this->parentProfile, $link->id, 45);

    expect($updated->study_goal_minutes)->toBe(45);
});

test('updateChildStudyDuration rejects link belonging to another parent', function () {
    $otherProfile = ParentProfile::factory()->create();
    $link = ParentChildLink::factory()->active()->create([
        'parent_profile_id' => $otherProfile->id,
    ]);

    expect(fn () => $this->service->updateChildStudyDuration($this->parentProfile, $link->id, 30))
        ->toThrow(\Illuminate\Database\Eloquent\ModelNotFoundException::class);
});

test('updateChildStudyDuration throws for invalid link ID', function () {
    expect(fn () => $this->service->updateChildStudyDuration(
        $this->parentProfile,
        '00000000-0000-0000-0000-000000000000',
        30,
    ))->toThrow(\Illuminate\Database\Eloquent\ModelNotFoundException::class);
});
