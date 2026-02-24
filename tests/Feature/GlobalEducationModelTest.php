<?php

use App\Enums\EducationSystemType;
use App\Enums\ScaleType;
use App\Models\AssessmentType;
use App\Models\CalendarTerm;
use App\Models\Country;
use App\Models\CurriculumSubject;
use App\Models\CurriculumTier;
use App\Models\Discipline;
use App\Models\EducationLevel;
use App\Models\EducationSystem;
use App\Models\GradingScale;
use App\Models\Institution;
use App\Models\InstitutionType;
use App\Models\LevelSubject;
use App\Models\Stream;

test('education system can be created with factory', function () {
    $system = EducationSystem::factory()->create();

    expect($system)->toBeInstanceOf(EducationSystem::class)
        ->and($system->name)->not->toBeNull()
        ->and($system->slug)->not->toBeNull()
        ->and($system->system_type)->toBeInstanceOf(EducationSystemType::class);
});

test('education system belongs to country', function () {
    $country = Country::factory()->create();
    $system = EducationSystem::factory()->create(['country_id' => $country->id]);

    expect($system->country->id)->toBe($country->id);
});

test('international education system has nullable country', function () {
    $system = EducationSystem::factory()->international()->create();

    expect($system->country_id)->toBeNull()
        ->and($system->system_type)->toBe(EducationSystemType::International);
});

test('curriculum tier belongs to education system', function () {
    $system = EducationSystem::factory()->create();
    $tier = CurriculumTier::factory()->create(['education_system_id' => $system->id]);

    expect($tier->educationSystem->id)->toBe($system->id);
});

test('curriculum tier has many education levels', function () {
    $tier = CurriculumTier::factory()->create();
    EducationLevel::factory()->create(['curriculum_tier_id' => $tier->id, 'sort_order' => 1]);
    EducationLevel::factory()->create(['curriculum_tier_id' => $tier->id, 'sort_order' => 2]);

    expect($tier->educationLevels)->toHaveCount(2);
});

test('education level belongs to curriculum tier', function () {
    $tier = CurriculumTier::factory()->create();
    $level = EducationLevel::factory()->create(['curriculum_tier_id' => $tier->id]);

    expect($level->curriculumTier->id)->toBe($tier->id);
});

test('stream belongs to education system and applies from tier', function () {
    $system = EducationSystem::factory()->create();
    $tier = CurriculumTier::factory()->create(['education_system_id' => $system->id]);
    $stream = Stream::factory()->create([
        'education_system_id' => $system->id,
        'applies_from_tier_id' => $tier->id,
    ]);

    expect($stream->educationSystem->id)->toBe($system->id)
        ->and($stream->appliesFromTier->id)->toBe($tier->id);
});

test('grading scale can be created with factory', function () {
    $scale = GradingScale::factory()->create();

    expect($scale)->toBeInstanceOf(GradingScale::class)
        ->and($scale->scale_type)->toBeInstanceOf(ScaleType::class)
        ->and($scale->grade_boundaries)->toBeArray();
});

test('grading scale cgpa state includes classification labels', function () {
    $scale = GradingScale::factory()->cgpa()->create();

    expect($scale->scale_type)->toBe(ScaleType::Cgpa)
        ->and($scale->classification_labels)->toBeArray()
        ->and($scale->classification_labels)->not->toBeEmpty();
});

test('curriculum subject belongs to education system and discipline', function () {
    $system = EducationSystem::factory()->create();
    $discipline = Discipline::factory()->create();
    $subject = CurriculumSubject::factory()->create([
        'education_system_id' => $system->id,
        'discipline_id' => $discipline->id,
    ]);

    expect($subject->educationSystem->id)->toBe($system->id)
        ->and($subject->discipline->id)->toBe($discipline->id);
});

test('level subject links education level to curriculum subject', function () {
    $level = EducationLevel::factory()->create();
    $subject = CurriculumSubject::factory()->create();
    $levelSubject = LevelSubject::factory()->create([
        'education_level_id' => $level->id,
        'curriculum_subject_id' => $subject->id,
    ]);

    expect($levelSubject->educationLevel->id)->toBe($level->id)
        ->and($levelSubject->curriculumSubject->id)->toBe($subject->id)
        ->and($levelSubject->is_compulsory)->toBeTrue();
});

test('level subject can be optional with stream', function () {
    $stream = Stream::factory()->create();
    $levelSubject = LevelSubject::factory()->optional()->create([
        'stream_id' => $stream->id,
    ]);

    expect($levelSubject->is_compulsory)->toBeFalse()
        ->and($levelSubject->stream->id)->toBe($stream->id);
});

test('assessment type belongs to education system and grading scale', function () {
    $system = EducationSystem::factory()->create();
    $scale = GradingScale::factory()->create();
    $assessment = AssessmentType::factory()->create([
        'education_system_id' => $system->id,
        'grading_scale_id' => $scale->id,
    ]);

    expect($assessment->educationSystem->id)->toBe($system->id)
        ->and($assessment->gradingScale->id)->toBe($scale->id);
});

test('assessment type exit exam state', function () {
    $assessment = AssessmentType::factory()->exitExam()->create();

    expect($assessment->is_exit_exam)->toBeTrue()
        ->and($assessment->is_entrance_exam)->toBeFalse();
});

test('institution type belongs to country and grading scale', function () {
    $country = Country::factory()->create();
    $scale = GradingScale::factory()->create();
    $type = InstitutionType::factory()->create([
        'country_id' => $country->id,
        'grading_scale_id' => $scale->id,
    ]);

    expect($type->country->id)->toBe($country->id)
        ->and($type->gradingScale->id)->toBe($scale->id)
        ->and($type->level_progression)->toBeArray()
        ->and($type->qualification_names)->toBeArray();
});

test('institution can have many education systems via pivot', function () {
    $institution = Institution::factory()->create();
    $system1 = EducationSystem::factory()->create();
    $system2 = EducationSystem::factory()->create();

    $institution->educationSystems()->attach([$system1->id, $system2->id]);

    expect($institution->educationSystems)->toHaveCount(2);
});

test('calendar term belongs to institution', function () {
    $institution = Institution::factory()->create();
    $term = CalendarTerm::factory()->create(['institution_id' => $institution->id]);

    expect($term->institution->id)->toBe($institution->id);
});

test('education system has many curriculum tiers', function () {
    $system = EducationSystem::factory()->create();
    CurriculumTier::factory()->create(['education_system_id' => $system->id, 'slug' => 'tier-a']);
    CurriculumTier::factory()->create(['education_system_id' => $system->id, 'slug' => 'tier-b']);

    expect($system->curriculumTiers)->toHaveCount(2);
});

test('education system has many streams', function () {
    $system = EducationSystem::factory()->create();
    $tier = CurriculumTier::factory()->create(['education_system_id' => $system->id]);
    Stream::factory()->create(['education_system_id' => $system->id, 'applies_from_tier_id' => $tier->id, 'name' => 'Science']);
    Stream::factory()->create(['education_system_id' => $system->id, 'applies_from_tier_id' => $tier->id, 'name' => 'Arts']);

    expect($system->streams)->toHaveCount(2);
});

test('education system has many curriculum subjects', function () {
    $system = EducationSystem::factory()->create();
    CurriculumSubject::factory()->create(['education_system_id' => $system->id, 'slug' => 'math']);
    CurriculumSubject::factory()->create(['education_system_id' => $system->id, 'slug' => 'english']);

    expect($system->curriculumSubjects)->toHaveCount(2);
});

test('discipline has many curriculum subjects', function () {
    $discipline = Discipline::factory()->create();
    CurriculumSubject::factory()->create(['discipline_id' => $discipline->id, 'slug' => 'math-1']);
    CurriculumSubject::factory()->create(['discipline_id' => $discipline->id, 'slug' => 'math-2']);

    expect($discipline->curriculumSubjects)->toHaveCount(2);
});

test('unique constraints are enforced', function () {
    $system = EducationSystem::factory()->create();
    CurriculumTier::factory()->create([
        'education_system_id' => $system->id,
        'slug' => 'unique-tier',
    ]);

    expect(fn () => CurriculumTier::factory()->create([
        'education_system_id' => $system->id,
        'slug' => 'unique-tier',
    ]))->toThrow(\Illuminate\Database\UniqueConstraintViolationException::class);
});

test('level subject created_at is automatically set', function () {
    $levelSubject = LevelSubject::factory()->create();

    expect($levelSubject->created_at)->not->toBeNull();
});
