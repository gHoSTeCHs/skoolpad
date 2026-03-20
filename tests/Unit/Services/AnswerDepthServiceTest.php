<?php

use App\Enums\AnswerDepthLevel;
use App\Models\User;
use App\Services\AnswerDepthService;

uses(Tests\TestCase::class);

test('returns all depths when monetization is disabled', function () {
    config(['skoolpad.monetization_enabled' => false]);
    $service = new AnswerDepthService;
    $user = User::factory()->make();

    $depths = $service->getAvailableDepths($user);

    expect($depths)->toHaveCount(3)
        ->and($depths)->toContain(AnswerDepthLevel::Quick)
        ->and($depths)->toContain(AnswerDepthLevel::Standard)
        ->and($depths)->toContain(AnswerDepthLevel::DeepDive);
});

test('returns only quick for free tier when monetization enabled', function () {
    config(['skoolpad.monetization_enabled' => true]);
    $service = new AnswerDepthService;
    $user = User::factory()->make();

    $depths = $service->getAvailableDepths($user);

    expect($depths)->toHaveCount(1)
        ->and($depths[0])->toBe(AnswerDepthLevel::Quick);
});

test('monetization is disabled by default', function () {
    $service = new AnswerDepthService;

    expect($service->isMonetizationEnabled())->toBeFalse();
});

test('canAccessDepth allows all depths when monetization disabled', function () {
    config(['skoolpad.monetization_enabled' => false]);
    $service = new AnswerDepthService;
    $user = User::factory()->make();

    expect($service->canAccessDepth($user, AnswerDepthLevel::Quick))->toBeTrue()
        ->and($service->canAccessDepth($user, AnswerDepthLevel::Standard))->toBeTrue()
        ->and($service->canAccessDepth($user, AnswerDepthLevel::DeepDive))->toBeTrue();
});

test('canAccessDepth restricts depths when monetization enabled', function () {
    config(['skoolpad.monetization_enabled' => true]);
    $service = new AnswerDepthService;
    $user = User::factory()->make();

    expect($service->canAccessDepth($user, AnswerDepthLevel::Quick))->toBeTrue()
        ->and($service->canAccessDepth($user, AnswerDepthLevel::Standard))->toBeFalse()
        ->and($service->canAccessDepth($user, AnswerDepthLevel::DeepDive))->toBeFalse();
});
