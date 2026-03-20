<?php

use App\Enums\ParentChildLinkStatus;
use App\Models\ParentCheckInSession;
use App\Models\ParentChildLink;

test('command generates sessions for active links without existing sessions', function () {
    $link = ParentChildLink::factory()->active()->withTermConfig()->create();

    $this->artisan('parent:generate-check-ins')
        ->assertSuccessful();

    $this->assertDatabaseHas('parent_check_in_sessions', [
        'parent_child_link_id' => $link->id,
        'session_date' => now()->toDateString(),
    ]);
});

test('command skips links that already have today session', function () {
    $link = ParentChildLink::factory()->active()->withTermConfig()->create();

    ParentCheckInSession::factory()->create([
        'parent_child_link_id' => $link->id,
        'session_date' => now()->toDateString(),
    ]);

    $this->artisan('parent:generate-check-ins')
        ->assertSuccessful();

    $count = ParentCheckInSession::query()
        ->where('parent_child_link_id', $link->id)
        ->where('session_date', now()->toDateString())
        ->count();

    expect($count)->toBe(1);
});

test('command skips non-active links', function () {
    ParentChildLink::factory()->create([
        'status' => ParentChildLinkStatus::Pending,
    ]);
    ParentChildLink::factory()->create([
        'status' => ParentChildLinkStatus::Revoked,
    ]);

    $this->artisan('parent:generate-check-ins')
        ->assertSuccessful();

    expect(ParentCheckInSession::query()->count())->toBe(0);
});

test('command handles errors gracefully and continues processing', function () {
    $link1 = ParentChildLink::factory()->active()->withTermConfig()->create();
    $link2 = ParentChildLink::factory()->active()->withTermConfig()->create();

    $mockService = Mockery::mock(App\Services\ParentCheckInService::class);
    $callCount = 0;
    $mockService->shouldReceive('generateCheckIn')
        ->twice()
        ->andReturnUsing(function ($link) use ($link1, &$callCount) {
            $callCount++;
            if ($link->id === $link1->id) {
                throw new \RuntimeException('Simulated failure');
            }

            return ParentCheckInSession::factory()->create([
                'parent_child_link_id' => $link->id,
                'session_date' => now()->toDateString(),
            ]);
        });

    $this->app->instance(App\Services\ParentCheckInService::class, $mockService);

    $this->artisan('parent:generate-check-ins')
        ->assertSuccessful();

    $this->assertDatabaseHas('parent_check_in_sessions', [
        'parent_child_link_id' => $link2->id,
        'session_date' => now()->toDateString(),
    ]);
});
