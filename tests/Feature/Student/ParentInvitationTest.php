<?php

use App\Enums\ParentChildLinkStatus;
use App\Models\StudentProfile;
use App\Models\User;

beforeEach(function () {
    $this->student = User::factory()->create();
    $this->actingAs($this->student);
});

test('dismiss sets parent_invite_dismissed_at', function () {
    $profile = StudentProfile::factory()->secondary()->create([
        'user_id' => $this->student->id,
    ]);

    $this->post(route('parent-invitation.dismiss'))
        ->assertRedirect();

    $profile->refresh();
    expect($profile->parent_invite_dismissed_at)->not->toBeNull();
});

test('send creates parent child link', function () {
    $profile = StudentProfile::factory()->secondary()->create([
        'user_id' => $this->student->id,
    ]);

    $this->post(route('parent-invitation.send'), [
        'parent_email' => 'parent@example.com',
    ])->assertRedirect();

    $this->assertDatabaseHas('parent_child_links', [
        'student_profile_id' => $profile->id,
        'status' => ParentChildLinkStatus::Pending->value,
    ]);
});

test('send validates parent email', function () {
    StudentProfile::factory()->secondary()->create([
        'user_id' => $this->student->id,
    ]);

    $this->post(route('parent-invitation.send'), [
        'parent_email' => 'not-an-email',
    ])->assertSessionHasErrors('parent_email');
});

test('parent invitation not shown after dismissal', function () {
    StudentProfile::factory()->secondary()->create([
        'user_id' => $this->student->id,
        'parent_invite_dismissed_at' => now(),
    ]);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('parent_invitation', null)
        );
});
