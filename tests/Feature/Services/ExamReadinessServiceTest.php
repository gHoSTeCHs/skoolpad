<?php

use App\Enums\SpacedRepetitionStatus;
use App\Models\CanonicalTopic;
use App\Models\ExamReadinessCache;
use App\Models\LevelSubject;
use App\Models\ParentChildLink;
use App\Models\PracticeSession;
use App\Models\QuestionTopicLink;
use App\Models\SchemeOfWorkItem;
use App\Models\SpacedRepetitionItem;
use App\Models\TopicCompletion;
use App\Models\User;
use App\Models\VerificationAttempt;
use App\Services\ExamReadinessService;

beforeEach(function () {
    $this->service = new ExamReadinessService;
    $this->student = User::factory()->create();
    $this->levelSubject = LevelSubject::factory()->create();
});

test('calculateForSubject returns cache record with composite score', function () {
    $cache = $this->service->calculateForSubject($this->student, $this->levelSubject->id);

    expect($cache)->toBeInstanceOf(ExamReadinessCache::class);
    expect($cache->user_id)->toBe($this->student->id);
    expect($cache->curriculum_subject_level_id)->toBe($this->levelSubject->id);
    expect((float) $cache->composite_score)->toBeGreaterThanOrEqual(0);
    expect($cache->calculated_at)->not->toBeNull();
});

test('full formula calculates practice performance from completed sessions', function () {
    PracticeSession::factory()->count(10)->create([
        'user_id' => $this->student->id,
        'level_subject_id' => $this->levelSubject->id,
        'completed_at' => now(),
        'score_percentage' => 80,
    ]);

    $cache = $this->service->calculateForSubject($this->student, $this->levelSubject->id);

    expect((float) $cache->practice_performance)->toBe(80.00);
});

test('device-less formula used when fewer than 3 practice sessions', function () {
    PracticeSession::factory()->create([
        'user_id' => $this->student->id,
        'completed_at' => now(),
    ]);

    $cache = $this->service->calculateForSubject($this->student, $this->levelSubject->id);

    expect($cache)->toBeInstanceOf(ExamReadinessCache::class);
    expect((float) $cache->practice_performance)->toBe(0.00);
});

test('blend mode interpolates between formulas', function () {
    PracticeSession::factory()->count(6)->create([
        'user_id' => $this->student->id,
        'completed_at' => now(),
        'score_percentage' => 90,
    ]);

    $cache = $this->service->calculateForSubject($this->student, $this->levelSubject->id);

    expect($cache)->toBeInstanceOf(ExamReadinessCache::class);
});

test('spaced retention calculation counts graduated vs active', function () {
    $topic = CanonicalTopic::factory()->create();
    SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $this->levelSubject->id,
        'canonical_topic_id' => $topic->id,
    ]);

    $question = \App\Models\Question::factory()->create();
    QuestionTopicLink::query()->create([
        'question_id' => $question->id,
        'canonical_topic_id' => $topic->id,
        'is_primary' => true,
    ]);

    SpacedRepetitionItem::factory()->create([
        'user_id' => $this->student->id,
        'question_id' => $question->id,
        'status' => SpacedRepetitionStatus::Graduated,
    ]);

    PracticeSession::factory()->count(10)->create([
        'user_id' => $this->student->id,
        'completed_at' => now(),
    ]);

    $cache = $this->service->calculateForSubject($this->student, $this->levelSubject->id);

    expect((float) $cache->spaced_retention)->toBe(100.00);
});

test('recalculateAll processes all cached subjects for user', function () {
    $ls1 = LevelSubject::factory()->create();
    $ls2 = LevelSubject::factory()->create();

    ExamReadinessCache::factory()->create([
        'user_id' => $this->student->id,
        'curriculum_subject_level_id' => $ls1->id,
        'composite_score' => 50,
    ]);
    ExamReadinessCache::factory()->create([
        'user_id' => $this->student->id,
        'curriculum_subject_level_id' => $ls2->id,
        'composite_score' => 60,
    ]);

    $this->service->recalculateAll($this->student);

    $caches = ExamReadinessCache::query()
        ->where('user_id', $this->student->id)
        ->get();

    expect($caches)->toHaveCount(2);
    foreach ($caches as $cache) {
        expect($cache->calculated_at->isToday())->toBeTrue();
    }
});

test('getProjectedReadiness returns projected score', function () {
    ExamReadinessCache::factory()->create([
        'user_id' => $this->student->id,
        'curriculum_subject_level_id' => $this->levelSubject->id,
        'composite_score' => 60,
    ]);

    $projected = $this->service->getProjectedReadiness(
        $this->student,
        $this->levelSubject->id,
        now()->addWeeks(4),
    );

    expect($projected)->not->toBeNull();
    expect($projected)->toBeGreaterThan(60);
});

test('getProjectedReadiness returns null without cached data', function () {
    $projected = $this->service->getProjectedReadiness(
        $this->student,
        $this->levelSubject->id,
        now()->addWeeks(4),
    );

    expect($projected)->toBeNull();
});

test('getCachedReadiness returns single record for specific subject', function () {
    ExamReadinessCache::factory()->create([
        'user_id' => $this->student->id,
        'curriculum_subject_level_id' => $this->levelSubject->id,
    ]);

    $cached = $this->service->getCachedReadiness($this->student, $this->levelSubject->id);

    expect($cached)->toBeInstanceOf(ExamReadinessCache::class);
});

test('getCachedReadiness returns all subjects when no levelSubjectId', function () {
    $ls1 = LevelSubject::factory()->create();
    $ls2 = LevelSubject::factory()->create();

    ExamReadinessCache::factory()->create(['user_id' => $this->student->id, 'curriculum_subject_level_id' => $ls1->id]);
    ExamReadinessCache::factory()->create(['user_id' => $this->student->id, 'curriculum_subject_level_id' => $ls2->id]);

    $cached = $this->service->getCachedReadiness($this->student);

    expect($cached)->toHaveCount(2);
});

test('getExamReadinessTrend returns empty array stub', function () {
    $trend = $this->service->getExamReadinessTrend($this->student, $this->levelSubject->id);

    expect($trend)->toBe([]);
});

test('syllabus coverage does not double-count completed and verified topics', function () {
    $topic = CanonicalTopic::factory()->create();
    SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $this->levelSubject->id,
        'canonical_topic_id' => $topic->id,
    ]);

    TopicCompletion::query()->create([
        'user_id' => $this->student->id,
        'canonical_topic_id' => $topic->id,
        'completed_at' => now(),
    ]);

    $link = ParentChildLink::factory()->active()->create();
    VerificationAttempt::factory()->understood()->create([
        'parent_child_link_id' => $link->id,
        'canonical_topic_id' => $topic->id,
    ]);

    PracticeSession::factory()->count(10)->create([
        'user_id' => $this->student->id,
        'completed_at' => now(),
    ]);

    $cache = $this->service->calculateForSubject($this->student, $this->levelSubject->id);

    expect((float) $cache->syllabus_coverage)->toBe(100.00);
});
