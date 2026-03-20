<?php

use App\Models\ExamCountdown;
use App\Models\ParentChildLink;
use App\Models\UserSubscription;
use App\Notifications\ParentExamAlert;
use Illuminate\Support\Facades\Notification;

test('sends alert for exam within alert window to premium parent', function () {
    Notification::fake();

    $link = ParentChildLink::factory()->active()->create();
    $childUser = $link->studentProfile->user;
    $parentUser = $link->parentProfile->user;

    UserSubscription::factory()->create([
        'user_id' => $parentUser->id,
        'status' => 'active',
    ]);

    ExamCountdown::factory()->examInDays(5)->create([
        'user_id' => $childUser->id,
    ]);

    $this->artisan('parent:send-exam-alerts')
        ->assertSuccessful();

    Notification::assertSentTo($parentUser, ParentExamAlert::class);
});

test('skips non-premium parents when monetization enabled', function () {
    config(['skoolpad.monetization_enabled' => true]);
    Notification::fake();

    $link = ParentChildLink::factory()->active()->create();
    $childUser = $link->studentProfile->user;

    ExamCountdown::factory()->examInDays(5)->create([
        'user_id' => $childUser->id,
    ]);

    $this->artisan('parent:send-exam-alerts')
        ->assertSuccessful();

    Notification::assertNothingSent();
});

test('skips exams outside alert window', function () {
    Notification::fake();

    $link = ParentChildLink::factory()->active()->create();
    $childUser = $link->studentProfile->user;
    $parentUser = $link->parentProfile->user;

    UserSubscription::factory()->create([
        'user_id' => $parentUser->id,
        'status' => 'active',
    ]);

    ExamCountdown::factory()->examInDays(30)->create([
        'user_id' => $childUser->id,
        'alert_start_days_before' => 14,
    ]);

    $this->artisan('parent:send-exam-alerts')
        ->assertSuccessful();

    Notification::assertNothingSent();
});

test('skips inactive exams', function () {
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
