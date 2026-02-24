<?php

use App\Enums\ParentalRelationship;
use App\Enums\ParentChildLinkStatus;
use App\Enums\VerificationResult;
use App\Models\CanonicalTopic;
use App\Models\EducationLevel;
use App\Models\EducationSystem;
use App\Models\ExamReadinessCache;
use App\Models\LevelSubject;
use App\Models\ParentChildLink;
use App\Models\ParentProfile;
use App\Models\Stream;
use App\Models\StudentProfile;
use App\Models\User;
use App\Models\VerificationAttempt;

test('parent profile can be created with factory', function () {
    $profile = ParentProfile::factory()->create();

    expect($profile)->toBeInstanceOf(ParentProfile::class)
        ->and($profile->relationship)->toBeInstanceOf(ParentalRelationship::class)
        ->and($profile->notification_preferences)->toBeArray();
});

test('parent profile belongs to user', function () {
    $user = User::factory()->create();
    $profile = ParentProfile::factory()->create(['user_id' => $user->id]);

    expect($profile->user->id)->toBe($user->id);
});

test('parent profile user_id is unique', function () {
    $user = User::factory()->create();
    ParentProfile::factory()->create(['user_id' => $user->id]);

    expect(fn () => ParentProfile::factory()->create([
        'user_id' => $user->id,
    ]))->toThrow(\Illuminate\Database\UniqueConstraintViolationException::class);
});

test('user has one parent profile', function () {
    $user = User::factory()->create();
    $profile = ParentProfile::factory()->create(['user_id' => $user->id]);

    expect($user->parentProfile->id)->toBe($profile->id);
});

test('parent child link can be created with factory', function () {
    $link = ParentChildLink::factory()->create();

    expect($link)->toBeInstanceOf(ParentChildLink::class)
        ->and($link->status)->toBe(ParentChildLinkStatus::Pending)
        ->and($link->linked_at)->toBeNull()
        ->and($link->study_goal_minutes)->toBeNull();
});

test('parent child link active state', function () {
    $link = ParentChildLink::factory()->active()->create();

    expect($link->status)->toBe(ParentChildLinkStatus::Active)
        ->and($link->linked_at)->not->toBeNull()
        ->and($link->data_consent_granted_at)->not->toBeNull();
});

test('parent child link with study goal', function () {
    $link = ParentChildLink::factory()->withStudyGoal(45)->create();

    expect($link->study_goal_minutes)->toBe(45);
});

test('parent child link belongs to parent and student profiles', function () {
    $parent = ParentProfile::factory()->create();
    $student = StudentProfile::factory()->create();
    $link = ParentChildLink::factory()->create([
        'parent_profile_id' => $parent->id,
        'student_profile_id' => $student->id,
    ]);

    expect($link->parentProfile->id)->toBe($parent->id)
        ->and($link->studentProfile->id)->toBe($student->id);
});

test('parent child link unique constraint', function () {
    $parent = ParentProfile::factory()->create();
    $student = StudentProfile::factory()->create();
    ParentChildLink::factory()->create([
        'parent_profile_id' => $parent->id,
        'student_profile_id' => $student->id,
    ]);

    expect(fn () => ParentChildLink::factory()->create([
        'parent_profile_id' => $parent->id,
        'student_profile_id' => $student->id,
    ]))->toThrow(\Illuminate\Database\UniqueConstraintViolationException::class);
});

test('parent profile has many child links', function () {
    $parent = ParentProfile::factory()->create();
    ParentChildLink::factory()->create(['parent_profile_id' => $parent->id]);
    ParentChildLink::factory()->create(['parent_profile_id' => $parent->id]);

    expect($parent->parentChildLinks)->toHaveCount(2);
});

test('student profile has many parent child links', function () {
    $student = StudentProfile::factory()->create();
    ParentChildLink::factory()->create(['student_profile_id' => $student->id]);
    ParentChildLink::factory()->create(['student_profile_id' => $student->id]);

    expect($student->parentChildLinks)->toHaveCount(2);
});

test('verification attempt can be created with factory', function () {
    $attempt = VerificationAttempt::factory()->create();

    expect($attempt)->toBeInstanceOf(VerificationAttempt::class)
        ->and($attempt->overall_result)->toBeInstanceOf(VerificationResult::class)
        ->and($attempt->responses)->toBeArray()
        ->and($attempt->responses)->toHaveKeys(['explain_checklist', 'true_false']);
});

test('verification attempt understood state', function () {
    $attempt = VerificationAttempt::factory()->understood()->create();

    expect($attempt->overall_result)->toBe(VerificationResult::Understood);
});

test('verification attempt needs review state', function () {
    $attempt = VerificationAttempt::factory()->needsReview()->create();

    expect($attempt->overall_result)->toBe(VerificationResult::NeedsReview);
});

test('verification attempt belongs to parent child link', function () {
    $link = ParentChildLink::factory()->active()->create();
    $attempt = VerificationAttempt::factory()->create(['parent_child_link_id' => $link->id]);

    expect($attempt->parentChildLink->id)->toBe($link->id);
});

test('verification attempt belongs to canonical topic', function () {
    $topic = CanonicalTopic::factory()->create();
    $attempt = VerificationAttempt::factory()->create(['canonical_topic_id' => $topic->id]);

    expect($attempt->canonicalTopic->id)->toBe($topic->id);
});

test('parent child link has many verification attempts', function () {
    $link = ParentChildLink::factory()->active()->create();
    VerificationAttempt::factory()->create(['parent_child_link_id' => $link->id]);
    VerificationAttempt::factory()->create(['parent_child_link_id' => $link->id]);

    expect($link->verificationAttempts)->toHaveCount(2);
});

test('canonical topic has many verification attempts', function () {
    $topic = CanonicalTopic::factory()->create();
    VerificationAttempt::factory()->create(['canonical_topic_id' => $topic->id]);
    VerificationAttempt::factory()->create(['canonical_topic_id' => $topic->id]);

    expect($topic->verificationAttempts)->toHaveCount(2);
});

test('exam readiness cache can be created', function () {
    $user = User::factory()->create();
    $levelSubject = LevelSubject::factory()->create();

    $cache = ExamReadinessCache::create([
        'user_id' => $user->id,
        'curriculum_subject_level_id' => $levelSubject->id,
        'syllabus_coverage' => 75.50,
        'practice_performance' => 82.00,
        'spaced_retention' => 60.25,
        'parent_verification' => 90.00,
        'composite_score' => 76.44,
        'calculated_at' => now(),
    ]);

    expect($cache)->toBeInstanceOf(ExamReadinessCache::class)
        ->and((float) $cache->syllabus_coverage)->toBe(75.50)
        ->and((float) $cache->composite_score)->toBe(76.44)
        ->and($cache->calculated_at)->not->toBeNull();
});

test('exam readiness cache unique constraint on user and subject', function () {
    $user = User::factory()->create();
    $levelSubject = LevelSubject::factory()->create();

    ExamReadinessCache::create([
        'user_id' => $user->id,
        'curriculum_subject_level_id' => $levelSubject->id,
        'calculated_at' => now(),
    ]);

    expect(fn () => ExamReadinessCache::create([
        'user_id' => $user->id,
        'curriculum_subject_level_id' => $levelSubject->id,
        'calculated_at' => now(),
    ]))->toThrow(\Illuminate\Database\UniqueConstraintViolationException::class);
});

test('exam readiness cache belongs to user', function () {
    $user = User::factory()->create();
    $levelSubject = LevelSubject::factory()->create();

    $cache = ExamReadinessCache::create([
        'user_id' => $user->id,
        'curriculum_subject_level_id' => $levelSubject->id,
        'calculated_at' => now(),
    ]);

    expect($cache->user->id)->toBe($user->id);
});

test('exam readiness cache belongs to level subject', function () {
    $user = User::factory()->create();
    $levelSubject = LevelSubject::factory()->create();

    $cache = ExamReadinessCache::create([
        'user_id' => $user->id,
        'curriculum_subject_level_id' => $levelSubject->id,
        'calculated_at' => now(),
    ]);

    expect($cache->levelSubject->id)->toBe($levelSubject->id);
});

test('user has many exam readiness caches', function () {
    $user = User::factory()->create();
    $ls1 = LevelSubject::factory()->create();
    $ls2 = LevelSubject::factory()->create();

    ExamReadinessCache::create(['user_id' => $user->id, 'curriculum_subject_level_id' => $ls1->id, 'calculated_at' => now()]);
    ExamReadinessCache::create(['user_id' => $user->id, 'curriculum_subject_level_id' => $ls2->id, 'calculated_at' => now()]);

    expect($user->examReadinessCaches)->toHaveCount(2);
});

test('student profile new education model relationships', function () {
    $educationSystem = EducationSystem::factory()->create();
    $educationLevel = EducationLevel::factory()->create();
    $stream = Stream::factory()->create();

    $profile = StudentProfile::factory()->create([
        'education_system_id' => $educationSystem->id,
        'education_level_id' => $educationLevel->id,
        'stream_id' => $stream->id,
    ]);

    expect($profile->educationSystem->id)->toBe($educationSystem->id)
        ->and($profile->educationLevel->id)->toBe($educationLevel->id)
        ->and($profile->stream->id)->toBe($stream->id);
});

test('student profile new fields', function () {
    $profile = StudentProfile::factory()->create([
        'school_name' => 'Federal Government College',
        'state_or_region' => 'Lagos',
        'invite_code' => 'AB12CD',
        'exam_goals' => ['waec', 'neco', 'jamb'],
        'study_preferences' => ['daily_goal_minutes' => 30],
    ]);

    expect($profile->school_name)->toBe('Federal Government College')
        ->and($profile->state_or_region)->toBe('Lagos')
        ->and($profile->invite_code)->toBe('AB12CD')
        ->and($profile->exam_goals)->toBe(['waec', 'neco', 'jamb'])
        ->and($profile->study_preferences)->toBe(['daily_goal_minutes' => 30]);
});

test('student profile invite code is unique', function () {
    StudentProfile::factory()->create(['invite_code' => 'XY99ZW']);

    expect(fn () => StudentProfile::factory()->create([
        'invite_code' => 'XY99ZW',
    ]))->toThrow(\Illuminate\Database\UniqueConstraintViolationException::class);
});

test('cascade delete removes child links when parent profile is deleted', function () {
    $parent = ParentProfile::factory()->create();
    ParentChildLink::factory()->create(['parent_profile_id' => $parent->id]);
    ParentChildLink::factory()->create(['parent_profile_id' => $parent->id]);

    expect(ParentChildLink::where('parent_profile_id', $parent->id)->count())->toBe(2);

    $parent->delete();

    expect(ParentChildLink::where('parent_profile_id', $parent->id)->count())->toBe(0);
});

test('cascade delete removes verification attempts when link is deleted', function () {
    $link = ParentChildLink::factory()->create();
    VerificationAttempt::factory()->create(['parent_child_link_id' => $link->id]);
    VerificationAttempt::factory()->create(['parent_child_link_id' => $link->id]);

    expect(VerificationAttempt::where('parent_child_link_id', $link->id)->count())->toBe(2);

    $link->delete();

    expect(VerificationAttempt::where('parent_child_link_id', $link->id)->count())->toBe(0);
});

test('parental relationship enum has 3 cases', function () {
    expect(ParentalRelationship::cases())->toHaveCount(3)
        ->and(ParentalRelationship::Mother->value)->toBe('mother')
        ->and(ParentalRelationship::Father->value)->toBe('father')
        ->and(ParentalRelationship::Guardian->value)->toBe('guardian');
});

test('parent child link status enum has 3 cases', function () {
    expect(ParentChildLinkStatus::cases())->toHaveCount(3)
        ->and(ParentChildLinkStatus::Pending->value)->toBe('pending')
        ->and(ParentChildLinkStatus::Active->value)->toBe('active')
        ->and(ParentChildLinkStatus::Revoked->value)->toBe('revoked');
});

test('verification result enum has 3 cases', function () {
    expect(VerificationResult::cases())->toHaveCount(3)
        ->and(VerificationResult::Understood->value)->toBe('understood')
        ->and(VerificationResult::PartiallyUnderstood->value)->toBe('partially_understood')
        ->and(VerificationResult::NeedsReview->value)->toBe('needs_review');
});
