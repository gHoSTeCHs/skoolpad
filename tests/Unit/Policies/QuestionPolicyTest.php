<?php

use App\Enums\UserRole;
use App\Models\Question;
use App\Models\User;

uses(Tests\TestCase::class, Illuminate\Foundation\Testing\RefreshDatabase::class);

test('staff can view questions', function () {
    $user = User::factory()->create(['role' => UserRole::ContentManager]);

    expect($user->can('viewAny', Question::class))->toBeTrue();
});

test('students cannot view admin questions', function () {
    $user = User::factory()->create(['role' => UserRole::Student]);

    expect($user->can('viewAny', Question::class))->toBeFalse();
});

test('content manager can publish', function () {
    $user = User::factory()->create(['role' => UserRole::ContentManager]);

    expect($user->can('publish', Question::class))->toBeTrue();
});

test('institution moderator cannot publish', function () {
    $user = User::factory()->create(['role' => UserRole::InstitutionModerator]);

    expect($user->can('publish', Question::class))->toBeFalse();
});
