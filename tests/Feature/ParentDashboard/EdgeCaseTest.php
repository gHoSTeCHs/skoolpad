<?php

use App\Enums\VerificationResult;
use App\Models\ParentChildLink;
use App\Models\ParentProfile;
use App\Services\ParentCheckInService;
use App\Services\ParentVerificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('staggers check-ins for parents with 3+ children', function () {
    $parentProfile = ParentProfile::factory()->create();

    ParentChildLink::factory()
        ->active()
        ->count(4)
        ->create(['parent_profile_id' => $parentProfile->id]);

    $service = app(ParentCheckInService::class);
    $plan = $service->getStaggeredCheckInPlan($parentProfile);

    expect($plan)->toHaveCount(4);

    $scheduledToday = collect($plan)->where('scheduled_today', true)->count();
    expect($scheduledToday)->toBeGreaterThanOrEqual(1)
        ->and($scheduledToday)->toBeLessThanOrEqual(3);
});

it('schedules all children when parent has 2 or fewer', function () {
    $parentProfile = ParentProfile::factory()->create();

    ParentChildLink::factory()
        ->active()
        ->count(2)
        ->create(['parent_profile_id' => $parentProfile->id]);

    $service = app(ParentCheckInService::class);
    $plan = $service->getStaggeredCheckInPlan($parentProfile);

    expect($plan)->toHaveCount(2);

    $scheduledToday = collect($plan)->where('scheduled_today', true)->count();
    expect($scheduledToday)->toBe(2);
});

it('returns empty plan for parents with no linked children', function () {
    $parentProfile = ParentProfile::factory()->create();

    $service = app(ParentCheckInService::class);
    $plan = $service->getStaggeredCheckInPlan($parentProfile);

    expect($plan)->toBeEmpty();
});

it('enables quick mode for parents with 3+ children', function () {
    $parentProfile = ParentProfile::factory()->create();

    ParentChildLink::factory()
        ->active()
        ->count(3)
        ->create(['parent_profile_id' => $parentProfile->id]);

    $service = app(ParentCheckInService::class);

    expect($service->getQuickModeEnabled($parentProfile))->toBeTrue();
});

it('does not enable quick mode for parents with fewer than 3 children', function () {
    $parentProfile = ParentProfile::factory()->create();

    ParentChildLink::factory()
        ->active()
        ->create(['parent_profile_id' => $parentProfile->id]);

    $service = app(ParentCheckInService::class);

    expect($service->getQuickModeEnabled($parentProfile))->toBeFalse();
});

it('flags verification completed too quickly', function () {
    $service = app(ParentVerificationService::class);

    $responses = [
        'explain_checklist' => [
            ['prompt' => 'Explain photosynthesis', 'checked' => true],
        ],
        'true_false' => [
            ['statement' => 'Plants need sunlight', 'child_answer' => true, 'correct' => true],
            ['statement' => 'Plants produce CO2', 'child_answer' => false, 'correct' => true],
        ],
    ];

    $result = $service->validateVerificationIntegrity(
        responses: $responses,
        overallResult: VerificationResult::Understood,
        timeOnScreenSeconds: 5,
    );

    expect($result)->toContain('verification_too_fast');
});

it('flags result mismatch when marked understood but scored poorly', function () {
    $service = app(ParentVerificationService::class);

    $responses = [
        'true_false' => [
            ['statement' => 'Statement A', 'child_answer' => true, 'correct' => true],
            ['statement' => 'Statement B', 'child_answer' => true, 'correct' => false],
            ['statement' => 'Statement C', 'child_answer' => false, 'correct' => false],
            ['statement' => 'Statement D', 'child_answer' => true, 'correct' => false],
        ],
    ];

    $result = $service->validateVerificationIntegrity(
        responses: $responses,
        overallResult: VerificationResult::Understood,
        timeOnScreenSeconds: 300,
    );

    expect($result)->toContain('result_mismatch');
});

it('returns no warnings for legitimate verification', function () {
    $service = app(ParentVerificationService::class);

    $responses = [
        'explain_checklist' => [
            ['prompt' => 'Explain the water cycle', 'checked' => true],
            ['prompt' => 'Describe evaporation', 'checked' => true],
        ],
        'true_false' => [
            ['statement' => 'Water evaporates from oceans', 'child_answer' => true, 'correct' => true],
            ['statement' => 'Rain falls from clouds', 'child_answer' => true, 'correct' => true],
        ],
    ];

    $result = $service->validateVerificationIntegrity(
        responses: $responses,
        overallResult: VerificationResult::Understood,
        timeOnScreenSeconds: 300,
    );

    expect($result)->toBeEmpty();
});
