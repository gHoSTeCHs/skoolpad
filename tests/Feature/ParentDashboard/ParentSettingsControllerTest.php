<?php

use App\Models\ParentChildLink;
use App\Models\ParentProfile;
use App\Models\StudentProfile;
use App\Models\User;

beforeEach(function () {
    $this->parentUser = User::factory()->parent()->create();
    $this->parentProfile = ParentProfile::factory()->create(['user_id' => $this->parentUser->id]);
    $this->actingAs($this->parentUser);
});

test('parent can view settings page', function () {
    $this->get(route('parent.settings'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('parent/settings'));
});

test('settings page includes notification preferences and children settings', function () {
    ParentChildLink::factory()->active()->withStudyGoal(30)->create([
        'parent_profile_id' => $this->parentProfile->id,
    ]);

    $this->get(route('parent.settings'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('notification_preferences')
            ->has('children_settings', 1)
        );
});

test('parent can update notification preferences', function () {
    $this->put(route('parent.settings.notifications'), [
        'alert_channels' => ['email', 'in_app'],
    ])->assertRedirect();

    $this->parentProfile->refresh();
    expect($this->parentProfile->notification_preferences['alert_channels'])->toBe(['email', 'in_app']);
});

test('notification preferences rejects invalid channel', function () {
    $this->put(route('parent.settings.notifications'), [
        'alert_channels' => ['pigeon'],
    ])->assertSessionHasErrors('alert_channels.0');
});

test('parent can update child study duration', function () {
    $link = ParentChildLink::factory()->active()->create([
        'parent_profile_id' => $this->parentProfile->id,
    ]);

    $this->put(route('parent.settings.study-duration', $link->id), [
        'study_goal_minutes' => 45,
    ])->assertRedirect();

    $link->refresh();
    expect($link->study_goal_minutes)->toBe(45);
});

test('study duration rejects invalid minutes', function () {
    $link = ParentChildLink::factory()->active()->create([
        'parent_profile_id' => $this->parentProfile->id,
    ]);

    $this->put(route('parent.settings.study-duration', $link->id), [
        'study_goal_minutes' => 25,
    ])->assertSessionHasErrors('study_goal_minutes');
});

test('parent cannot update study duration for another parents child', function () {
    $otherProfile = ParentProfile::factory()->create();
    $otherLink = ParentChildLink::factory()->active()->create([
        'parent_profile_id' => $otherProfile->id,
    ]);

    $this->put(route('parent.settings.study-duration', $otherLink->id), [
        'study_goal_minutes' => 30,
    ])->assertNotFound();
});

test('student user cannot access settings', function () {
    $student = User::factory()->create();
    StudentProfile::factory()->for($student)->create();

    $this->actingAs($student)
        ->get(route('parent.settings'))
        ->assertForbidden();
});
