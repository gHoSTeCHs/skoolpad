<?php

use App\Mail\WeeklyParentReport;
use App\Models\ParentChildLink;
use App\Models\UserSubscription;
use Illuminate\Support\Facades\Mail;

test('command sends reports for active links with premium subscription', function () {
    Mail::fake();

    $link = ParentChildLink::factory()->active()->create();
    $parentUser = $link->parentProfile->user;

    UserSubscription::factory()->create([
        'user_id' => $parentUser->id,
        'status' => 'active',
    ]);

    $this->artisan('parent:send-weekly-reports')
        ->assertSuccessful();

    Mail::assertSent(WeeklyParentReport::class, 1);
});

test('command skips non-premium parents when monetization enabled', function () {
    config(['skoolpad.monetization_enabled' => true]);
    Mail::fake();

    ParentChildLink::factory()->active()->create();

    $this->artisan('parent:send-weekly-reports')
        ->assertSuccessful();

    Mail::assertNotSent(WeeklyParentReport::class);
});

test('command handles errors gracefully', function () {
    Mail::fake();

    $link1 = ParentChildLink::factory()->active()->create();
    $link2 = ParentChildLink::factory()->active()->create();

    UserSubscription::factory()->create([
        'user_id' => $link1->parentProfile->user->id,
        'status' => 'active',
    ]);
    UserSubscription::factory()->create([
        'user_id' => $link2->parentProfile->user->id,
        'status' => 'active',
    ]);

    $this->artisan('parent:send-weekly-reports')
        ->assertSuccessful();
});
