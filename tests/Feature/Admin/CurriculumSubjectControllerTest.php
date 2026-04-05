<?php

use App\Models\CurriculumSubject;
use App\Models\Discipline;
use App\Models\EducationSystem;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->system = EducationSystem::factory()->create();
    $this->discipline = Discipline::factory()->create();
});

test('store creates a subject under the system', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.curriculum-subjects.store', $this->system), [
            'name' => 'Mathematics',
            'slug' => 'mathematics',
            'discipline_id' => $this->discipline->id,
        ])
        ->assertRedirect(route('admin.education-systems.show', $this->system));

    $this->assertDatabaseHas('curriculum_subjects', [
        'education_system_id' => $this->system->id,
        'name' => 'Mathematics',
        'slug' => 'mathematics',
    ]);
});

test('store auto-generates slug when omitted', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.curriculum-subjects.store', $this->system), [
            'name' => 'Further Mathematics',
            'discipline_id' => $this->discipline->id,
        ])
        ->assertRedirect(route('admin.education-systems.show', $this->system));

    $this->assertDatabaseHas('curriculum_subjects', [
        'name' => 'Further Mathematics',
        'slug' => 'further-mathematics',
    ]);
});

test('store validates required fields', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.curriculum-subjects.store', $this->system), [])
        ->assertSessionHasErrors(['name', 'discipline_id']);
});

test('update modifies a subject', function () {
    $subject = CurriculumSubject::factory()->create([
        'education_system_id' => $this->system->id,
        'discipline_id' => $this->discipline->id,
    ]);

    $this->actingAs($this->admin)
        ->put(route('admin.curriculum-subjects.update', $subject), [
            'name' => 'Updated Subject',
            'slug' => 'updated-subject',
            'discipline_id' => $this->discipline->id,
        ])
        ->assertRedirect(route('admin.education-systems.show', $this->system));

    expect($subject->fresh()->name)->toBe('Updated Subject');
});

test('destroy deletes a subject', function () {
    $subject = CurriculumSubject::factory()->create([
        'education_system_id' => $this->system->id,
        'discipline_id' => $this->discipline->id,
    ]);

    $this->actingAs($this->admin)
        ->delete(route('admin.curriculum-subjects.destroy', $subject))
        ->assertRedirect(route('admin.education-systems.show', $this->system));

    $this->assertDatabaseMissing('curriculum_subjects', ['id' => $subject->id]);
});

test('staff without manage_institutions permission get 403', function () {
    $staff = User::factory()->contentManager()->create();

    $this->actingAs($staff)
        ->post(route('admin.curriculum-subjects.store', $this->system), [
            'name' => 'Blocked Subject',
            'discipline_id' => $this->discipline->id,
        ])
        ->assertForbidden();
});
