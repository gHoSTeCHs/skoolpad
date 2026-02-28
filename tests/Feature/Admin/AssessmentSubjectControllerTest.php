<?php

use App\Models\AssessmentSubject;
use App\Models\AssessmentType;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->assessmentType = AssessmentType::factory()->create();
});

test('store creates an assessment subject', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.assessment-subjects.store', $this->assessmentType), [
            'name' => 'Mathematics',
            'slug' => 'mathematics',
            'is_compulsory' => true,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('assessment_subjects', [
        'assessment_type_id' => $this->assessmentType->id,
        'name' => 'Mathematics',
        'is_compulsory' => true,
    ]);
});

test('store auto-generates slug when omitted', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.assessment-subjects.store', $this->assessmentType), [
            'name' => 'English Language',
            'is_compulsory' => false,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('assessment_subjects', [
        'name' => 'English Language',
        'slug' => 'english-language',
    ]);
});

test('store validates required fields', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.assessment-subjects.store', $this->assessmentType), [])
        ->assertSessionHasErrors(['name']);
});

test('update modifies an assessment subject', function () {
    $subject = AssessmentSubject::factory()->create([
        'assessment_type_id' => $this->assessmentType->id,
    ]);

    $this->actingAs($this->admin)
        ->put(route('admin.assessment-subjects.update', $subject), [
            'name' => 'Updated Subject',
            'slug' => $subject->slug,
            'is_compulsory' => false,
        ])
        ->assertRedirect();

    expect($subject->fresh()->name)->toBe('Updated Subject');
});

test('destroy deletes an assessment subject', function () {
    $subject = AssessmentSubject::factory()->create([
        'assessment_type_id' => $this->assessmentType->id,
    ]);

    $this->actingAs($this->admin)
        ->delete(route('admin.assessment-subjects.destroy', $subject))
        ->assertRedirect();

    $this->assertDatabaseMissing('assessment_subjects', ['id' => $subject->id]);
});
