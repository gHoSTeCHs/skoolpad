<?php

use App\Models\StudentProfile;
use App\Models\User;

beforeEach(function () {
    $this->student = User::factory()->create();
    $this->profile = StudentProfile::factory()->secondary()->create([
        'user_id' => $this->student->id,
    ]);
    $this->actingAs($this->student);
});

test('student can update daily goal minutes', function () {
    $this->patch(route('study-preferences.update'), [
        'daily_goal_minutes' => 45,
    ])->assertRedirect();

    expect($this->profile->fresh()->study_preferences['daily_goal_minutes'])->toBe(45);
});

test('daily goal minutes must be valid value', function () {
    $this->patch(route('study-preferences.update'), [
        'daily_goal_minutes' => 20,
    ])->assertSessionHasErrors('daily_goal_minutes');

    $this->patch(route('study-preferences.update'), [
        'daily_goal_minutes' => null,
    ])->assertSessionHasErrors('daily_goal_minutes');
});

test('guest cannot update study preferences', function () {
    auth()->logout();

    $this->patch(route('study-preferences.update'), [
        'daily_goal_minutes' => 30,
    ])->assertRedirect(route('login'));
});
