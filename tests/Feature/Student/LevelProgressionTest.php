<?php

use App\Models\CurriculumTier;
use App\Models\EducationLevel;
use App\Models\EducationSystem;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Support\Carbon;

beforeEach(function () {
    $this->student = User::factory()->create();
    $this->actingAs($this->student);
});

test('check returns no prompt for tertiary student', function () {
    StudentProfile::factory()->create([
        'user_id' => $this->student->id,
    ]);

    $this->getJson(route('api.level-progression.check'))
        ->assertOk()
        ->assertJson(['show_prompt' => false]);
});

test('check returns prompt for secondary student during transition period', function () {
    $system = EducationSystem::factory()->create();
    $tier = CurriculumTier::factory()->for($system)->create(['is_tertiary' => false, 'sort_order' => 1]);
    $level1 = EducationLevel::factory()->for($tier, 'curriculumTier')->create(['sort_order' => 1, 'name' => 'JSS 1']);
    $level2 = EducationLevel::factory()->for($tier, 'curriculumTier')->create(['sort_order' => 2, 'name' => 'JSS 2']);

    StudentProfile::factory()->secondary()->create([
        'user_id' => $this->student->id,
        'education_system_id' => $system->id,
        'education_level_id' => $level1->id,
    ]);

    Carbon::setTestNow(Carbon::create(2026, 1, 5));

    $this->getJson(route('api.level-progression.check'))
        ->assertOk()
        ->assertJson([
            'show_prompt' => true,
            'next_level_id' => $level2->id,
        ]);

    Carbon::setTestNow();
});

test('check returns no prompt outside transition period', function () {
    $system = EducationSystem::factory()->create();
    $tier = CurriculumTier::factory()->for($system)->create(['is_tertiary' => false, 'sort_order' => 1]);
    $level1 = EducationLevel::factory()->for($tier, 'curriculumTier')->create(['sort_order' => 1]);
    EducationLevel::factory()->for($tier, 'curriculumTier')->create(['sort_order' => 2]);

    StudentProfile::factory()->secondary()->create([
        'user_id' => $this->student->id,
        'education_system_id' => $system->id,
        'education_level_id' => $level1->id,
    ]);

    Carbon::setTestNow(Carbon::create(2026, 6, 15));

    $this->getJson(route('api.level-progression.check'))
        ->assertOk()
        ->assertJson(['show_prompt' => false]);

    Carbon::setTestNow();
});

test('update changes education level', function () {
    $system = EducationSystem::factory()->create();
    $tier = CurriculumTier::factory()->for($system)->create(['is_tertiary' => false]);
    $level1 = EducationLevel::factory()->for($tier, 'curriculumTier')->create(['sort_order' => 1]);
    $level2 = EducationLevel::factory()->for($tier, 'curriculumTier')->create(['sort_order' => 2]);

    $profile = StudentProfile::factory()->secondary()->create([
        'user_id' => $this->student->id,
        'education_system_id' => $system->id,
        'education_level_id' => $level1->id,
    ]);

    $this->post(route('level-progression.update'), [
        'education_level_id' => $level2->id,
    ])->assertRedirect(route('dashboard'));

    $profile->refresh();
    expect($profile->education_level_id)->toBe($level2->id);
});

test('update validates education level id', function () {
    StudentProfile::factory()->secondary()->create([
        'user_id' => $this->student->id,
    ]);

    $this->post(route('level-progression.update'), [])
        ->assertSessionHasErrors('education_level_id');

    $this->post(route('level-progression.update'), [
        'education_level_id' => 'not-a-uuid',
    ])->assertSessionHasErrors('education_level_id');
});
