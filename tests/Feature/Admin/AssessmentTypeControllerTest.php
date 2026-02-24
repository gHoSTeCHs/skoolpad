<?php

use App\Models\AssessmentType;
use App\Models\EducationSystem;
use App\Models\GradingScale;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->system = EducationSystem::factory()->create();
    $this->gradingScale = GradingScale::factory()->create();
});

test('store creates an assessment type under the system', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.assessment-types.store', $this->system), [
            'name' => 'WAEC SSCE',
            'slug' => 'waec-ssce',
            'is_exit_exam' => true,
            'is_entrance_exam' => false,
            'grading_scale_id' => $this->gradingScale->id,
        ])
        ->assertRedirect(route('admin.education-systems.show', $this->system));

    $this->assertDatabaseHas('assessment_types', [
        'education_system_id' => $this->system->id,
        'name' => 'WAEC SSCE',
        'is_exit_exam' => true,
    ]);
});

test('store auto-generates slug when omitted', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.assessment-types.store', $this->system), [
            'name' => 'JAMB UTME',
            'is_exit_exam' => false,
            'is_entrance_exam' => true,
            'grading_scale_id' => $this->gradingScale->id,
        ])
        ->assertRedirect(route('admin.education-systems.show', $this->system));

    $this->assertDatabaseHas('assessment_types', [
        'name' => 'JAMB UTME',
        'slug' => 'jamb-utme',
    ]);
});

test('store validates required fields', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.assessment-types.store', $this->system), [])
        ->assertSessionHasErrors(['name', 'is_exit_exam', 'is_entrance_exam', 'grading_scale_id']);
});

test('update modifies an assessment type', function () {
    $assessment = AssessmentType::factory()->create([
        'education_system_id' => $this->system->id,
    ]);

    $this->actingAs($this->admin)
        ->put(route('admin.assessment-types.update', $assessment), [
            'name' => 'Updated Assessment',
            'slug' => $assessment->slug,
            'is_exit_exam' => false,
            'is_entrance_exam' => true,
            'grading_scale_id' => $assessment->grading_scale_id,
        ])
        ->assertRedirect(route('admin.education-systems.show', $this->system));

    expect($assessment->fresh()->name)->toBe('Updated Assessment');
    expect($assessment->fresh()->is_entrance_exam)->toBeTrue();
});

test('destroy deletes an assessment type', function () {
    $assessment = AssessmentType::factory()->create([
        'education_system_id' => $this->system->id,
    ]);

    $this->actingAs($this->admin)
        ->delete(route('admin.assessment-types.destroy', $assessment))
        ->assertRedirect(route('admin.education-systems.show', $this->system));

    $this->assertDatabaseMissing('assessment_types', ['id' => $assessment->id]);
});
