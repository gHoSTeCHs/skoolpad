<?php

use App\Models\User;

test('student receives 403', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('admin.dashboard'))
        ->assertForbidden();
});

test('content manager passes through', function () {
    $user = User::factory()->contentManager()->create();

    $this->actingAs($user)
        ->get(route('admin.dashboard'))
        ->assertOk();
});

test('super admin passes through', function () {
    $user = User::factory()->admin()->create();

    $this->actingAs($user)
        ->get(route('admin.dashboard'))
        ->assertOk();
});

test('institution moderator passes through', function () {
    $user = User::factory()->institutionModerator()->create();

    $this->actingAs($user)
        ->get(route('admin.dashboard'))
        ->assertOk();
});
