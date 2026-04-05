<?php

use App\Models\CurriculumTier;
use App\Models\EducationSystem;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->system = EducationSystem::factory()->create();
});

test('store creates a tier under the system', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.curriculum-tiers.store', $this->system), [
            'name' => 'Senior Secondary',
            'slug' => 'senior-secondary',
            'sort_order' => 1,
            'is_tertiary' => false,
        ])
        ->assertRedirect(route('admin.education-systems.show', $this->system));

    $this->assertDatabaseHas('curriculum_tiers', [
        'education_system_id' => $this->system->id,
        'name' => 'Senior Secondary',
        'slug' => 'senior-secondary',
    ]);
});

test('store auto-generates slug when omitted', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.curriculum-tiers.store', $this->system), [
            'name' => 'Junior Secondary',
            'sort_order' => 0,
            'is_tertiary' => false,
        ])
        ->assertRedirect(route('admin.education-systems.show', $this->system));

    $this->assertDatabaseHas('curriculum_tiers', [
        'name' => 'Junior Secondary',
        'slug' => 'junior-secondary',
    ]);
});

test('store validates required fields', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.curriculum-tiers.store', $this->system), [])
        ->assertSessionHasErrors(['name', 'sort_order', 'is_tertiary']);
});

test('update modifies a tier', function () {
    $tier = CurriculumTier::factory()->create(['education_system_id' => $this->system->id]);

    $this->actingAs($this->admin)
        ->put(route('admin.curriculum-tiers.update', $tier), [
            'name' => 'Updated Tier',
            'slug' => $tier->slug,
            'sort_order' => 5,
            'is_tertiary' => true,
        ])
        ->assertRedirect(route('admin.education-systems.show', $this->system));

    expect($tier->fresh()->name)->toBe('Updated Tier');
    expect($tier->fresh()->is_tertiary)->toBeTrue();
});

test('destroy deletes a tier', function () {
    $tier = CurriculumTier::factory()->create(['education_system_id' => $this->system->id]);

    $this->actingAs($this->admin)
        ->delete(route('admin.curriculum-tiers.destroy', $tier))
        ->assertRedirect(route('admin.education-systems.show', $this->system));

    $this->assertDatabaseMissing('curriculum_tiers', ['id' => $tier->id]);
});

test('staff without manage_institutions permission get 403', function () {
    $staff = User::factory()->contentManager()->create();

    $this->actingAs($staff)
        ->post(route('admin.curriculum-tiers.store', $this->system), [
            'name' => 'Blocked Tier',
            'sort_order' => 1,
            'is_tertiary' => false,
        ])
        ->assertForbidden();
});
