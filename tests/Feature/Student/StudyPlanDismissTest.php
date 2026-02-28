<?php

use App\Models\CurriculumTier;
use App\Models\EducationLevel;
use App\Models\EducationSystem;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Support\Carbon;

beforeEach(function () {
    $this->student = User::factory()->create();
    $this->profile = StudentProfile::factory()->secondary()->create([
        'user_id' => $this->student->id,
    ]);
    $this->actingAs($this->student);
});

test('student can dismiss study plan for today', function () {
    Carbon::setTestNow(Carbon::create(2026, 2, 28));

    $this->post(route('study-plan.dismiss'))
        ->assertRedirect();

    expect($this->profile->fresh()->study_preferences['plan_dismissed_date'])
        ->toBe('2026-02-28');

    Carbon::setTestNow();
});

test('dashboard returns null guided_study when dismissed today', function () {
    Carbon::setTestNow(Carbon::create(2026, 2, 28));

    $this->profile->update([
        'study_preferences' => ['plan_dismissed_date' => '2026-02-28'],
    ]);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('guided_study', null)
            ->where('study_plan_dismissed', true)
        );

    Carbon::setTestNow();
});

test('dashboard returns guided_study when dismissed yesterday', function () {
    Carbon::setTestNow(Carbon::create(2026, 2, 28));

    $system = EducationSystem::factory()->create();
    $tier = CurriculumTier::factory()->for($system)->create(['is_tertiary' => false]);
    $level = EducationLevel::factory()->for($tier, 'curriculumTier')->create();

    $this->profile->update([
        'education_system_id' => $system->id,
        'education_level_id' => $level->id,
        'study_preferences' => ['plan_dismissed_date' => '2026-02-27'],
    ]);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->whereNot('guided_study', null)
            ->where('study_plan_dismissed', false)
        );

    Carbon::setTestNow();
});

test('guest cannot dismiss study plan', function () {
    auth()->logout();

    $this->post(route('study-plan.dismiss'))
        ->assertRedirect(route('login'));
});

test('dashboard passes study_plan_dismissed false when not dismissed', function () {
    $system = EducationSystem::factory()->create();
    $tier = CurriculumTier::factory()->for($system)->create(['is_tertiary' => false]);
    $level = EducationLevel::factory()->for($tier, 'curriculumTier')->create();

    $this->profile->update([
        'education_system_id' => $system->id,
        'education_level_id' => $level->id,
    ]);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('study_plan_dismissed', false)
        );
});
