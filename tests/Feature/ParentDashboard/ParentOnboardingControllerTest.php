<?php

use App\Enums\ParentalRelationship;
use App\Models\ParentProfile;
use App\Models\User;

test('parent can view onboarding page', function () {
    $user = User::factory()->parent()->create();

    $this->actingAs($user)
        ->get(route('parent.onboarding'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('parent/onboarding'));
});

test('student cannot access parent onboarding', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('parent.onboarding'))
        ->assertForbidden();
});

test('parent can create profile via onboarding', function () {
    $user = User::factory()->parent()->create();

    $this->actingAs($user)
        ->post(route('parent.onboarding.store'), [
            'relationship' => ParentalRelationship::Mother->value,
            'phone_number' => '08012345678',
        ])
        ->assertRedirect(route('parent.dashboard'));

    $this->assertDatabaseHas('parent_profiles', [
        'user_id' => $user->id,
        'relationship' => ParentalRelationship::Mother->value,
        'phone_number' => '08012345678',
    ]);
});

test('student cannot create parent profile', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('parent.onboarding.store'), [
            'relationship' => ParentalRelationship::Father->value,
        ])
        ->assertForbidden();

    $this->assertDatabaseMissing('parent_profiles', [
        'user_id' => $user->id,
    ]);
});

test('onboarding validates relationship field', function () {
    $user = User::factory()->parent()->create();

    $this->actingAs($user)
        ->post(route('parent.onboarding.store'), [])
        ->assertSessionHasErrors('relationship');
});

test('onboarding rejects invalid relationship value', function () {
    $user = User::factory()->parent()->create();

    $this->actingAs($user)
        ->post(route('parent.onboarding.store'), [
            'relationship' => 'uncle',
        ])
        ->assertSessionHasErrors('relationship');
});

test('already onboarded parent is redirected to dashboard', function () {
    $user = User::factory()->parent()->create();
    ParentProfile::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->get(route('parent.onboarding'))
        ->assertRedirect(route('parent.dashboard'));
});
