<?php

use App\Models\AssessmentSubject;
use App\Models\AssessmentType;
use App\Models\ExamGoal;
use App\Models\ExamReadinessCache;

uses(Tests\TestCase::class, Illuminate\Foundation\Testing\RefreshDatabase::class);

test('ExamGoal has assessmentSubject relationship', function () {
    $type = AssessmentType::factory()->create();
    $subject = AssessmentSubject::factory()->create(['assessment_type_id' => $type->id]);

    $goal = ExamGoal::factory()->create([
        'assessment_type_id' => $type->id,
        'assessment_subject_id' => $subject->id,
    ]);

    expect($goal->assessmentSubject)->toBeInstanceOf(AssessmentSubject::class)
        ->and($goal->assessmentSubject->id)->toBe($subject->id);
});

test('ExamGoal assessmentSubject is nullable', function () {
    $goal = ExamGoal::factory()->create(['assessment_subject_id' => null]);

    expect($goal->assessmentSubject)->toBeNull();
});

test('ExamReadinessCache can be created via factory', function () {
    $cache = ExamReadinessCache::factory()->create();

    expect($cache)->toBeInstanceOf(ExamReadinessCache::class)
        ->and($cache->exists)->toBeTrue()
        ->and($cache->composite_score)->not->toBeNull();
});
