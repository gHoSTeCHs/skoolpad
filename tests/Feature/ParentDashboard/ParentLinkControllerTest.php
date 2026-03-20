<?php

use App\Enums\ParentChildLinkStatus;
use App\Models\ParentChildLink;
use App\Models\StudentProfile;
use App\Models\User;

beforeEach(function () {
    $this->student = User::factory()->create();
    $this->studentProfile = StudentProfile::factory()->for($this->student)->create();
    $this->actingAs($this->student);
});

test('student can approve a pending parent link', function () {
    $link = ParentChildLink::factory()->create([
        'student_profile_id' => $this->studentProfile->id,
    ]);

    $this->post(route('secondary.parent-link.approve'), [
        'link_id' => $link->id,
    ])->assertRedirect();

    $link->refresh();
    expect($link->status)->toBe(ParentChildLinkStatus::Active);
    expect($link->linked_at)->not->toBeNull();
});

test('student cannot approve a link belonging to another student', function () {
    $otherProfile = StudentProfile::factory()->create();
    $link = ParentChildLink::factory()->create([
        'student_profile_id' => $otherProfile->id,
    ]);

    $this->post(route('secondary.parent-link.approve'), [
        'link_id' => $link->id,
    ])->assertNotFound();
});

test('student cannot approve an already active link', function () {
    $link = ParentChildLink::factory()->active()->create([
        'student_profile_id' => $this->studentProfile->id,
    ]);

    $this->post(route('secondary.parent-link.approve'), [
        'link_id' => $link->id,
    ])->assertNotFound();
});

test('approve validates link_id is required', function () {
    $this->post(route('secondary.parent-link.approve'), [])
        ->assertSessionHasErrors('link_id');
});

test('approve validates link_id exists', function () {
    $this->post(route('secondary.parent-link.approve'), [
        'link_id' => '00000000-0000-0000-0000-000000000000',
    ])->assertSessionHasErrors('link_id');
});

test('student can revoke an active parent link', function () {
    $link = ParentChildLink::factory()->active()->create([
        'student_profile_id' => $this->studentProfile->id,
    ]);

    $this->post(route('secondary.parent-link.revoke'), [
        'link_id' => $link->id,
    ])->assertRedirect();

    $link->refresh();
    expect($link->status)->toBe(ParentChildLinkStatus::Revoked);
});

test('student cannot revoke a link belonging to another student', function () {
    $otherProfile = StudentProfile::factory()->create();
    $link = ParentChildLink::factory()->active()->create([
        'student_profile_id' => $otherProfile->id,
    ]);

    $this->post(route('secondary.parent-link.revoke'), [
        'link_id' => $link->id,
    ])->assertNotFound();
});

test('revoking an already revoked link is idempotent', function () {
    $link = ParentChildLink::factory()->create([
        'student_profile_id' => $this->studentProfile->id,
        'status' => ParentChildLinkStatus::Revoked,
    ]);

    $this->post(route('secondary.parent-link.revoke'), [
        'link_id' => $link->id,
    ])->assertRedirect();

    $link->refresh();
    expect($link->status)->toBe(ParentChildLinkStatus::Revoked);
});

test('revoke validates link_id is required', function () {
    $this->post(route('secondary.parent-link.revoke'), [])
        ->assertSessionHasErrors('link_id');
});
