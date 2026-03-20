<?php

use App\Enums\ParentChildLinkStatus;
use App\Models\ParentChildLink;
use App\Models\ParentProfile;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Support\Facades\Route;

beforeEach(function () {
    Route::middleware(['auth', 'parent'])->get('/test-parent-access', fn () => response('ok'));
    Route::middleware(['auth', 'parent'])->get('/test-parent-child/{studentProfile}', fn () => response('ok'));
});

test('parent with profile can access parent routes', function () {
    $user = User::factory()->parent()->create();
    ParentProfile::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->get('/test-parent-access')
        ->assertOk();
});

test('parent without profile gets 403', function () {
    $user = User::factory()->parent()->create();

    $this->actingAs($user)
        ->get('/test-parent-access')
        ->assertForbidden();
});

test('student user gets 403 on parent routes', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/test-parent-access')
        ->assertForbidden();
});

test('parent can access linked child route', function () {
    $user = User::factory()->parent()->create();
    $parentProfile = ParentProfile::factory()->create(['user_id' => $user->id]);
    $link = ParentChildLink::factory()->active()->create(['parent_profile_id' => $parentProfile->id]);

    $this->actingAs($user)
        ->get('/test-parent-child/'.$link->student_profile_id)
        ->assertOk();
});

test('parent cannot access unlinked child route', function () {
    $user = User::factory()->parent()->create();
    ParentProfile::factory()->create(['user_id' => $user->id]);
    $otherChild = StudentProfile::factory()->create();

    $this->actingAs($user)
        ->get('/test-parent-child/'.$otherChild->id)
        ->assertForbidden();
});

test('parent cannot access child with revoked link', function () {
    $user = User::factory()->parent()->create();
    $parentProfile = ParentProfile::factory()->create(['user_id' => $user->id]);
    $link = ParentChildLink::factory()->create([
        'parent_profile_id' => $parentProfile->id,
        'status' => ParentChildLinkStatus::Revoked,
    ]);

    $this->actingAs($user)
        ->get('/test-parent-child/'.$link->student_profile_id)
        ->assertForbidden();
});

test('parent cannot access child with pending link', function () {
    $user = User::factory()->parent()->create();
    $parentProfile = ParentProfile::factory()->create(['user_id' => $user->id]);
    $link = ParentChildLink::factory()->create([
        'parent_profile_id' => $parentProfile->id,
        'status' => ParentChildLinkStatus::Pending,
    ]);

    $this->actingAs($user)
        ->get('/test-parent-child/'.$link->student_profile_id)
        ->assertForbidden();
});
