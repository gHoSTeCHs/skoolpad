<?php

use App\Models\ParentProfile;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Support\Facades\Route;

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

test('parent without profile is redirected to parent onboarding', function () {
    $user = User::factory()->parent()->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertRedirect(route('parent.onboarding'));
});

test('parent with profile passes through on parent routes', function () {
    Route::middleware(['auth', 'onboarded'])->get('/parent/test-route', fn () => response('ok'));

    $user = User::factory()->parent()->create();
    ParentProfile::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->get('/parent/test-route')
        ->assertOk();
});

test('parent with profile is redirected away from student routes', function () {
    $user = User::factory()->parent()->create();
    ParentProfile::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertRedirect(route('parent.dashboard'));
});
