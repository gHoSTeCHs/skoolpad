<?php

use App\Models\ParentProfile;
use App\Models\User;
use App\Notifications\ParentExamAlert;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    $this->alertData = [
        'child_name' => 'Adaeze',
        'exam_name' => 'WAEC Mathematics',
        'exam_date' => now()->addDays(5)->toDateString(),
        'days_remaining' => 5,
        'urgency' => 'warning',
        'readiness_score' => 68.0,
        'study_time_today_minutes' => 25,
        'questions_today' => 18,
        'accuracy_today' => 72.0,
        'unverified_topic_count' => 3,
    ];
});

test('via includes database and mail when email is in preferences', function () {
    $user = User::factory()->parent()->create();
    ParentProfile::factory()->create([
        'user_id' => $user->id,
        'notification_preferences' => ['exam_alert_channels' => ['email']],
    ]);

    $notification = new ParentExamAlert($this->alertData);
    $channels = $notification->via($user);

    expect($channels)->toContain('database');
    expect($channels)->toContain('mail');
});

test('via excludes mail when email not in preferences', function () {
    $user = User::factory()->parent()->create();
    ParentProfile::factory()->create([
        'user_id' => $user->id,
        'notification_preferences' => ['exam_alert_channels' => []],
    ]);

    $notification = new ParentExamAlert($this->alertData);
    $channels = $notification->via($user);

    expect($channels)->toContain('database');
    expect($channels)->not->toContain('mail');
});

test('email subject includes urgency prefix for critical alerts', function () {
    $this->alertData['urgency'] = 'critical';
    $this->alertData['days_remaining'] = 2;

    $user = User::factory()->parent()->create();
    $notification = new ParentExamAlert($this->alertData);
    $mail = $notification->toMail($user);

    expect($mail->subject)->toStartWith('[URGENT]');
    expect($mail->subject)->toContain('WAEC Mathematics');
});

test('exam day produces good luck message', function () {
    $this->alertData['urgency'] = 'exam_day';
    $this->alertData['days_remaining'] = 0;

    $user = User::factory()->parent()->create();
    $notification = new ParentExamAlert($this->alertData);
    $mail = $notification->toMail($user);

    expect($mail->subject)->toStartWith('[Today]');

    $rendered = (string) $mail->render();
    expect($rendered)->toContain('Good luck');
});

test('toArray returns correct data shape for database notification', function () {
    $user = User::factory()->parent()->create();
    $notification = new ParentExamAlert($this->alertData);
    $data = $notification->toArray($user);

    expect($data)->toHaveKeys(['type', 'exam_name', 'child_name', 'days_remaining', 'urgency', 'readiness_score', 'unverified_topic_count']);
    expect($data['type'])->toBe('exam_alert');
    expect($data['exam_name'])->toBe('WAEC Mathematics');
    expect($data['child_name'])->toBe('Adaeze');
    expect($data['days_remaining'])->toBe(5);
});

test('notification can be sent to user via Notification facade', function () {
    Notification::fake();

    $user = User::factory()->parent()->create();
    ParentProfile::factory()->create([
        'user_id' => $user->id,
        'notification_preferences' => ['exam_alert_channels' => ['email']],
    ]);

    $user->notify(new ParentExamAlert($this->alertData));

    Notification::assertSentTo($user, ParentExamAlert::class);
});
