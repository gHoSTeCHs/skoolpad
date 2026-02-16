<?php

use App\Models\StudentProfile;
use App\Models\User;

test('admin routes return 403 for students', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('admin.dashboard'))
        ->assertForbidden();
});

test('student routes redirect unonboarded students to onboarding', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('courses.index'))
        ->assertRedirect(route('onboarding.index'));
});

test('student routes work for onboarded students', function () {
    $user = User::factory()->create();
    StudentProfile::factory()->for($user)->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk();
});

test('admin routes work for staff users', function () {
    $user = User::factory()->admin()->create();

    $this->actingAs($user)
        ->get(route('admin.dashboard'))
        ->assertOk();
});

test('onboarding route is accessible to authenticated users', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('onboarding.index'))
        ->assertOk();
});
