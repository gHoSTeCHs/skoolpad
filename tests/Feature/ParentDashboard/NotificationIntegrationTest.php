<?php

use App\Models\ExamCountdown;
use App\Models\ExamReadinessCache;
use App\Models\LevelSubject;
use App\Models\ParentChildLink;
use App\Models\PracticeSession;
use App\Models\UserSubscription;
use App\Mail\WeeklyParentReport;
use App\Notifications\ParentExamAlert;
use App\Services\ParentNotificationService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

it('weekly report includes all data from the past week', function () {
    $service = new ParentNotificationService;
    $link = ParentChildLink::factory()->active()->create();
    $childUser = $link->studentProfile->user;
    $levelSubject = LevelSubject::factory()->create();

    PracticeSession::factory()->count(3)->create([
        'user_id' => $childUser->id,
        'level_subject_id' => $levelSubject->id,
        'completed_at' => now()->subDays(3),
        'total_time_seconds' => 600,
        'question_count' => 10,
        'score_percentage' => 75,
    ]);

    PracticeSession::factory()->create([
        'user_id' => $childUser->id,
        'level_subject_id' => $levelSubject->id,
        'completed_at' => now()->subDays(10),
        'total_time_seconds' => 600,
        'question_count' => 10,
        'score_percentage' => 90,
    ]);

    $weekStart = now()->subWeek();
    $weekEnd = now();

    $data = $service->compileWeeklyReportData(
        link: $link,
        weekStart: $weekStart,
        weekEnd: $weekEnd,
    );

    expect($data)
        ->toHaveKeys([
            'child_name',
            'study_time_minutes',
            'subjects_practiced',
            'questions_answered',
            'accuracy',
            'verifications',
            'readiness_scores',
        ]);

    expect($data['child_name'])->toBe($childUser->name);
    expect($data['study_time_minutes'])->toBe(30);
    expect($data['questions_answered'])->toBe(30);
    expect($data['accuracy'])->toBe(75.00);
    expect($data['verifications'])->toHaveKeys(['total', 'understood', 'needs_review']);
});

it('escalation schedule sends correct frequency per days-remaining bracket', function () {
    $service = new ParentNotificationService;

    Carbon::setTestNow(Carbon::parse('2026-04-01 08:00:00'));

    $examDay = ExamCountdown::factory()->create([
        'exam_date' => now()->toDateString(),
        'alert_start_days_before' => 14,
    ]);
    expect($service->shouldSendAlertToday($examDay))->toBeTrue();

    $oneDay = ExamCountdown::factory()->create([
        'exam_date' => now()->addDay()->toDateString(),
        'alert_start_days_before' => 14,
    ]);
    expect($service->shouldSendAlertToday($oneDay))->toBeTrue();

    $threeDays = ExamCountdown::factory()->create([
        'exam_date' => now()->addDays(3)->toDateString(),
        'alert_start_days_before' => 14,
    ]);
    expect($service->shouldSendAlertToday($threeDays))->toBeTrue();

    $sevenDays = ExamCountdown::factory()->create([
        'exam_date' => now()->addDays(7)->toDateString(),
        'alert_start_days_before' => 14,
    ]);
    expect($service->shouldSendAlertToday($sevenDays))->toBeTrue();

    $elevenDays = ExamCountdown::factory()->create([
        'exam_date' => now()->addDays(11)->toDateString(),
        'alert_start_days_before' => 14,
    ]);
    expect($service->shouldSendAlertToday($elevenDays))->toBeFalse();

    $tenDays = ExamCountdown::factory()->create([
        'exam_date' => now()->addDays(10)->toDateString(),
        'alert_start_days_before' => 14,
    ]);
    expect($service->shouldSendAlertToday($tenDays))->toBeTrue();

    $fifteenDays = ExamCountdown::factory()->create([
        'exam_date' => now()->addDays(15)->toDateString(),
        'alert_start_days_before' => 14,
    ]);
    expect($service->shouldSendAlertToday($fifteenDays))->toBeFalse();

    Carbon::setTestNow();
});

it('multi-child parent receives separate reports for each child', function () {
    Mail::fake();

    $link1 = ParentChildLink::factory()->active()->create();
    $parentProfile = $link1->parentProfile;
    $parentUser = $parentProfile->user;

    $link2 = ParentChildLink::factory()->active()->create([
        'parent_profile_id' => $parentProfile->id,
    ]);

    UserSubscription::factory()->create([
        'user_id' => $parentUser->id,
        'status' => 'active',
    ]);

    $this->artisan('parent:send-weekly-reports')
        ->assertSuccessful();

    Mail::assertSent(WeeklyParentReport::class, 2);
});

it('exam alert contains readiness score from ExamReadinessCache', function () {
    $service = new ParentNotificationService;
    $link = ParentChildLink::factory()->active()->create();
    $childUser = $link->studentProfile->user;

    $countdown = ExamCountdown::factory()->examInDays(5)->create([
        'user_id' => $childUser->id,
    ]);

    ExamReadinessCache::factory()->create([
        'user_id' => $childUser->id,
        'composite_score' => 72.50,
    ]);

    $data = $service->compileExamAlertData($link, $countdown);

    expect($data)
        ->toHaveKeys([
            'child_name',
            'exam_name',
            'days_remaining',
            'urgency',
            'readiness_score',
            'study_time_today_minutes',
            'unverified_topic_count',
        ]);

    expect($data['readiness_score'])->toBe(72.50);
    expect($data['child_name'])->toBe($childUser->name);
});

it('does not send reports to revoked parent-child links', function () {
    Mail::fake();

    $link = ParentChildLink::factory()->create([
        'status' => \App\Enums\ParentChildLinkStatus::Revoked,
    ]);

    $parentUser = $link->parentProfile->user;

    UserSubscription::factory()->create([
        'user_id' => $parentUser->id,
        'status' => 'active',
    ]);

    $this->artisan('parent:send-weekly-reports')
        ->assertSuccessful();

    Mail::assertNotSent(WeeklyParentReport::class);
});

it('does not send exam alerts for inactive exams', function () {
    Notification::fake();

    $link = ParentChildLink::factory()->active()->create();
    $childUser = $link->studentProfile->user;
    $parentUser = $link->parentProfile->user;

    UserSubscription::factory()->create([
        'user_id' => $parentUser->id,
        'status' => 'active',
    ]);

    ExamCountdown::factory()->examInDays(5)->inactive()->create([
        'user_id' => $childUser->id,
    ]);

    $this->artisan('parent:send-exam-alerts')
        ->assertSuccessful();

    Notification::assertNothingSent();
});
