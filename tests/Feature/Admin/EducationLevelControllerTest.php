<?php

use App\Models\CurriculumTier;
use App\Models\EducationLevel;
use App\Models\EducationSystem;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->system = EducationSystem::factory()->create();
    $this->tier = CurriculumTier::factory()->create(['education_system_id' => $this->system->id]);
});

test('store creates a level under the tier', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.education-levels.store', $this->tier), [
            'name' => 'SS1',
            'display_name' => 'Senior Secondary 1',
            'sort_order' => 1,
            'typical_age_min' => 15,
            'typical_age_max' => 16,
        ])
        ->assertRedirect(route('admin.education-systems.show', $this->system));

    $this->assertDatabaseHas('education_levels', [
        'curriculum_tier_id' => $this->tier->id,
        'name' => 'SS1',
    ]);
});

test('store validates required fields', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.education-levels.store', $this->tier), [])
        ->assertSessionHasErrors(['name', 'sort_order']);
});

test('update modifies a level', function () {
    $level = EducationLevel::factory()->create(['curriculum_tier_id' => $this->tier->id]);

    $this->actingAs($this->admin)
        ->put(route('admin.education-levels.update', $level), [
            'name' => 'Updated Level',
            'sort_order' => 3,
        ])
        ->assertRedirect(route('admin.education-systems.show', $this->system));

    expect($level->fresh()->name)->toBe('Updated Level');
});

test('destroy deletes a level', function () {
    $level = EducationLevel::factory()->create(['curriculum_tier_id' => $this->tier->id]);

    $this->actingAs($this->admin)
        ->delete(route('admin.education-levels.destroy', $level))
        ->assertRedirect(route('admin.education-systems.show', $this->system));

    $this->assertDatabaseMissing('education_levels', ['id' => $level->id]);
});
