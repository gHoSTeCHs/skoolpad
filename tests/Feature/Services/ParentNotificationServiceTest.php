<?php

use App\Models\ExamCountdown;
use App\Models\ExamReadinessCache;
use App\Models\LevelSubject;
use App\Models\ParentChildLink;
use App\Models\PracticeSession;
use App\Models\VerificationAttempt;
use App\Services\ParentNotificationService;

beforeEach(function () {
    $this->service = new ParentNotificationService;
    $this->link = ParentChildLink::factory()->active()->create();
    $this->childUser = $this->link->studentProfile->user;
});

test('compileWeeklyReportData returns study time, subjects, accuracy, verifications', function () {
    $levelSubject = LevelSubject::factory()->create();

    PracticeSession::factory()->count(3)->create([
        'user_id' => $this->childUser->id,
        'level_subject_id' => $levelSubject->id,
        'completed_at' => now()->subDays(2),
        'total_time_seconds' => 600,
        'question_count' => 10,
        'score_percentage' => 80,
    ]);

    VerificationAttempt::factory()->understood()->create([
        'parent_child_link_id' => $this->link->id,
        'created_at' => now()->subDays(1),
    ]);

    $data = $this->service->compileWeeklyReportData(
        link: $this->link,
        weekStart: now()->subWeek(),
        weekEnd: now(),
    );

    expect($data)->toHaveKeys(['child_name', 'study_time_minutes', 'subjects_practiced', 'questions_answered', 'accuracy', 'verifications', 'readiness_scores']);
    expect($data['study_time_minutes'])->toBe(30);
    expect($data['questions_answered'])->toBe(30);
    expect($data['accuracy'])->toBe(80.00);
    expect($data['verifications']['total'])->toBe(1);
    expect($data['verifications']['understood'])->toBe(1);
});

test('compileWeeklyReportData returns zeros when no activity', function () {
    $data = $this->service->compileWeeklyReportData(
        link: $this->link,
        weekStart: now()->subWeek(),
        weekEnd: now(),
    );

    expect($data['study_time_minutes'])->toBe(0);
    expect($data['questions_answered'])->toBe(0);
    expect($data['accuracy'])->toBe(0.00);
    expect($data['verifications']['total'])->toBe(0);
});

test('compileExamAlertData returns readiness, urgency, days remaining', function () {
    $countdown = ExamCountdown::factory()->examInDays(5)->create([
        'user_id' => $this->childUser->id,
    ]);

    ExamReadinessCache::factory()->create([
        'user_id' => $this->childUser->id,
        'composite_score' => 68,
    ]);

    $data = $this->service->compileExamAlertData($this->link, $countdown);

    expect($data)->toHaveKeys(['child_name', 'exam_name', 'days_remaining', 'urgency', 'readiness_score', 'study_time_today_minutes', 'unverified_topic_count']);
    expect($data['days_remaining'])->toBeGreaterThanOrEqual(4);
    expect($data['days_remaining'])->toBeLessThanOrEqual(5);
    expect($data['urgency'])->toBeIn(['warning', 'informational']);
    expect($data['readiness_score'])->toBe(68.00);
});

test('shouldSendAlertToday returns true for daily range 7-4 days', function () {
    $countdown = ExamCountdown::factory()->examInDays(5)->create();

    expect($this->service->shouldSendAlertToday($countdown))->toBeTrue();
});

test('shouldSendAlertToday returns false outside alert window', function () {
    $countdown = ExamCountdown::factory()->examInDays(20)->create([
        'alert_start_days_before' => 14,
    ]);

    expect($this->service->shouldSendAlertToday($countdown))->toBeFalse();
});

test('shouldSendAlertToday returns false for past exams', function () {
    $countdown = ExamCountdown::factory()->create([
        'exam_date' => now()->subDay(),
    ]);

    expect($this->service->shouldSendAlertToday($countdown))->toBeFalse();
});

test('shouldSendAlertToday returns true on exam day', function () {
    $countdown = ExamCountdown::factory()->create([
        'exam_date' => now()->toDateString(),
    ]);

    expect($this->service->shouldSendAlertToday($countdown))->toBeTrue();
});

test('getAlertEligibleExams returns only active exams within alert window', function () {
    ExamCountdown::factory()->examInDays(5)->create();
    ExamCountdown::factory()->examInDays(5)->inactive()->create();
    ExamCountdown::factory()->examInDays(30)->create(['alert_start_days_before' => 14]);

    $eligible = $this->service->getAlertEligibleExams();

    expect($eligible)->toHaveCount(1);
});
