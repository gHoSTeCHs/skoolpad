<?php

use App\Enums\ParentChildLinkStatus;
use App\Models\EducationLevel;
use App\Models\ParentChildLink;
use App\Models\ParentProfile;
use App\Models\StudentProfile;
use App\Models\User;

beforeEach(function () {
    $this->parentUser = User::factory()->parent()->create();
    $this->parentProfile = ParentProfile::factory()->create(['user_id' => $this->parentUser->id]);
    $this->actingAs($this->parentUser);
});

test('parent can view add child page', function () {
    $this->get(route('parent.children.add'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('parent/children/add'));
});

test('parent can create child account', function () {
    $educationLevel = EducationLevel::factory()->create();

    $this->post(route('parent.children.add.store'), [
        'child_name' => 'Adaeze Okafor',
        'child_email' => 'adaeze@example.com',
        'child_password' => 'securepassword123',
        'child_password_confirmation' => 'securepassword123',
        'education_level_id' => $educationLevel->id,
    ])->assertRedirect(route('parent.dashboard'));

    $this->assertDatabaseHas('users', [
        'name' => 'Adaeze Okafor',
        'email' => 'adaeze@example.com',
    ]);

    $this->assertDatabaseHas('parent_child_links', [
        'parent_profile_id' => $this->parentProfile->id,
        'status' => ParentChildLinkStatus::Active->value,
    ]);
});

test('create child validates required fields', function () {
    $this->post(route('parent.children.add.store'), [])
        ->assertSessionHasErrors(['child_name', 'child_email', 'child_password', 'education_level_id']);
});

test('create child validates unique email', function () {
    $existingUser = User::factory()->create();
    $educationLevel = EducationLevel::factory()->create();

    $this->post(route('parent.children.add.store'), [
        'child_name' => 'Test',
        'child_email' => $existingUser->email,
        'child_password' => 'securepassword123',
        'child_password_confirmation' => 'securepassword123',
        'education_level_id' => $educationLevel->id,
    ])->assertSessionHasErrors('child_email');
});

test('parent can link to existing student via invite code', function () {
    $studentProfile = StudentProfile::factory()->secondary()->create([
        'invite_code' => 'ABC123',
    ]);

    $this->post(route('parent.children.link'), [
        'invite_code' => 'ABC123',
    ])->assertRedirect(route('parent.dashboard'));

    $this->assertDatabaseHas('parent_child_links', [
        'parent_profile_id' => $this->parentProfile->id,
        'student_profile_id' => $studentProfile->id,
        'status' => ParentChildLinkStatus::Pending->value,
    ]);
});

test('link child validates invite code exists', function () {
    $this->post(route('parent.children.link'), [
        'invite_code' => 'NOPE00',
    ])->assertSessionHasErrors('invite_code');
});

test('link child validates invite code size', function () {
    $this->post(route('parent.children.link'), [
        'invite_code' => 'AB',
    ])->assertSessionHasErrors('invite_code');
});

test('parent can view linked child dashboard', function () {
    $link = ParentChildLink::factory()->active()->create([
        'parent_profile_id' => $this->parentProfile->id,
    ]);

    $this->get(route('parent.children.dashboard', $link->student_profile_id))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('parent/child-dashboard'));
});

test('parent cannot view unlinked child dashboard', function () {
    $otherChild = StudentProfile::factory()->create();

    $this->get(route('parent.children.dashboard', $otherChild->id))
        ->assertForbidden();
});

test('student user cannot access parent child routes', function () {
    $studentUser = User::factory()->create();
    StudentProfile::factory()->for($studentUser)->create();

    $this->actingAs($studentUser)
        ->get(route('parent.children.add'))
        ->assertForbidden();
});
