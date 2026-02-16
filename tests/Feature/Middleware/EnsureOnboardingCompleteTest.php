<?php

use App\Models\StudentProfile;
use App\Models\User;

test('student without profile is redirected to onboarding', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertRedirect(route('onboarding.index'));
});

test('student with profile passes through', function () {
    $user = User::factory()->create();
    StudentProfile::factory()->for($user)->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk();
});

test('staff user without profile passes through', function () {
    $user = User::factory()->contentManager()->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk();
});

test('unauthenticated user is not affected by onboarding middleware', function () {
    $this->get(route('dashboard'))
        ->assertRedirect(route('login'));
});
