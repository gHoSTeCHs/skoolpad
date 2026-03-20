<?php

use App\Models\ExamReadinessCache;
use App\Models\LevelSubject;
use App\Models\ReadinessScoreHistory;
use App\Models\User;
use App\Services\ExamReadinessService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->service = new ExamReadinessService;
    $this->student = User::factory()->create();
    $this->levelSubject = LevelSubject::factory()->create();
});

test('calculateForSubject records a history entry', function () {
    $this->service->calculateForSubject($this->student, $this->levelSubject->id);

    $this->assertDatabaseHas('readiness_score_history', [
        'user_id' => $this->student->id,
        'curriculum_subject_level_id' => $this->levelSubject->id,
    ]);

    expect(ReadinessScoreHistory::query()->count())->toBe(1);
});

test('multiple calculations create multiple history entries', function () {
    $this->service->calculateForSubject($this->student, $this->levelSubject->id);
    $this->service->calculateForSubject($this->student, $this->levelSubject->id);
    $this->service->calculateForSubject($this->student, $this->levelSubject->id);

    expect(ReadinessScoreHistory::query()->count())->toBe(3);
    expect(ExamReadinessCache::query()->count())->toBe(1);
});

test('projection uses historical delta when 2+ data points exist', function () {
    Carbon::setTestNow(Carbon::parse('2026-04-01'));

    $subjectId = $this->levelSubject->id;

    ExamReadinessCache::factory()->create([
        'user_id' => $this->student->id,
        'curriculum_subject_level_id' => $subjectId,
        'composite_score' => 60.00,
    ]);

    ReadinessScoreHistory::factory()->create([
        'user_id' => $this->student->id,
        'curriculum_subject_level_id' => $subjectId,
        'composite_score' => 40.00,
        'recorded_at' => now()->subWeeks(2),
    ]);

    ReadinessScoreHistory::factory()->create([
        'user_id' => $this->student->id,
        'curriculum_subject_level_id' => $subjectId,
        'composite_score' => 60.00,
        'recorded_at' => now(),
    ]);

    $examDate = now()->addWeeks(4);
    $projected = $this->service->getProjectedReadiness($this->student, $subjectId, $examDate);

    expect($projected)->not->toBeNull();
    expect($projected)->toBeGreaterThan(60.00);
    expect($projected)->toBeLessThanOrEqual(100.00);

    Carbon::setTestNow();
});

test('projection caps weekly delta at max 8 pts/week', function () {
    Carbon::setTestNow(Carbon::parse('2026-04-01'));

    $subjectId = $this->levelSubject->id;

    ExamReadinessCache::factory()->create([
        'user_id' => $this->student->id,
        'curriculum_subject_level_id' => $subjectId,
        'composite_score' => 80.00,
    ]);

    ReadinessScoreHistory::factory()->create([
        'user_id' => $this->student->id,
        'curriculum_subject_level_id' => $subjectId,
        'composite_score' => 20.00,
        'recorded_at' => now()->subWeek(),
    ]);

    ReadinessScoreHistory::factory()->create([
        'user_id' => $this->student->id,
        'curriculum_subject_level_id' => $subjectId,
        'composite_score' => 80.00,
        'recorded_at' => now(),
    ]);

    $examDate = now()->addWeeks(2);
    $projected = $this->service->getProjectedReadiness($this->student, $subjectId, $examDate);

    expect($projected)->toBeLessThanOrEqual(96.00);

    Carbon::setTestNow();
});

test('projection allows negative delta when student declines', function () {
    Carbon::setTestNow(Carbon::parse('2026-04-01'));

    $subjectId = $this->levelSubject->id;

    ExamReadinessCache::factory()->create([
        'user_id' => $this->student->id,
        'curriculum_subject_level_id' => $subjectId,
        'composite_score' => 50.00,
    ]);

    ReadinessScoreHistory::factory()->create([
        'user_id' => $this->student->id,
        'curriculum_subject_level_id' => $subjectId,
        'composite_score' => 70.00,
        'recorded_at' => now()->subWeeks(2),
    ]);

    ReadinessScoreHistory::factory()->create([
        'user_id' => $this->student->id,
        'curriculum_subject_level_id' => $subjectId,
        'composite_score' => 50.00,
        'recorded_at' => now(),
    ]);

    $examDate = now()->addWeeks(4);
    $projected = $this->service->getProjectedReadiness($this->student, $subjectId, $examDate);

    expect($projected)->toBeLessThan(50.00);
    expect($projected)->toBeGreaterThanOrEqual(0);

    Carbon::setTestNow();
});

test('projection falls back to decay curve with fewer than 2 history points', function () {
    $subjectId = $this->levelSubject->id;

    ExamReadinessCache::factory()->create([
        'user_id' => $this->student->id,
        'curriculum_subject_level_id' => $subjectId,
        'composite_score' => 60.00,
    ]);

    $examDate = now()->addWeeks(4);
    $projected = $this->service->getProjectedReadiness($this->student, $subjectId, $examDate);

    expect($projected)->not->toBeNull();
    expect($projected)->toBeGreaterThan(60.00);
    expect($projected)->toBeLessThan(100.00);
});

test('projection returns null when no cached readiness exists', function () {
    $projected = $this->service->getProjectedReadiness(
        $this->student,
        $this->levelSubject->id,
        now()->addWeeks(4)
    );

    expect($projected)->toBeNull();
});

test('getExamReadinessTrend returns history entries', function () {
    ReadinessScoreHistory::factory()->create([
        'user_id' => $this->student->id,
        'curriculum_subject_level_id' => $this->levelSubject->id,
        'composite_score' => 40.00,
        'recorded_at' => now()->subDays(7),
    ]);

    ReadinessScoreHistory::factory()->create([
        'user_id' => $this->student->id,
        'curriculum_subject_level_id' => $this->levelSubject->id,
        'composite_score' => 55.00,
        'recorded_at' => now()->subDays(3),
    ]);

    ReadinessScoreHistory::factory()->create([
        'user_id' => $this->student->id,
        'curriculum_subject_level_id' => $this->levelSubject->id,
        'composite_score' => 62.00,
        'recorded_at' => now(),
    ]);

    $trend = $this->service->getExamReadinessTrend($this->student, $this->levelSubject->id);

    expect($trend)->toHaveCount(3);
    expect($trend[0])->toHaveKeys(['date', 'score']);
    expect($trend[0]['score'])->toBe(40.00);
    expect($trend[2]['score'])->toBe(62.00);
});

test('getExamReadinessTrend excludes entries older than requested days', function () {
    ReadinessScoreHistory::factory()->create([
        'user_id' => $this->student->id,
        'curriculum_subject_level_id' => $this->levelSubject->id,
        'composite_score' => 30.00,
        'recorded_at' => now()->subDays(60),
    ]);

    ReadinessScoreHistory::factory()->create([
        'user_id' => $this->student->id,
        'curriculum_subject_level_id' => $this->levelSubject->id,
        'composite_score' => 50.00,
        'recorded_at' => now()->subDays(5),
    ]);

    $trend = $this->service->getExamReadinessTrend($this->student, $this->levelSubject->id, 28);

    expect($trend)->toHaveCount(1);
    expect($trend[0]['score'])->toBe(50.00);
});

test('decay curve produces diminishing returns', function () {
    $subjectId = $this->levelSubject->id;

    ExamReadinessCache::factory()->create([
        'user_id' => $this->student->id,
        'curriculum_subject_level_id' => $subjectId,
        'composite_score' => 80.00,
    ]);

    $projected4w = $this->service->getProjectedReadiness($this->student, $subjectId, now()->addWeeks(4));
    $projected8w = $this->service->getProjectedReadiness($this->student, $subjectId, now()->addWeeks(8));

    $gain4w = $projected4w - 80.00;
    $gain8w = $projected8w - 80.00;

    expect($gain8w)->toBeGreaterThan($gain4w);
    expect($gain8w)->toBeLessThan($gain4w * 2);
});
