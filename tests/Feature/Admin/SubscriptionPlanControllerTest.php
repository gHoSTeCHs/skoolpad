<?php

use App\Enums\BillingPeriod;
use App\Models\PlatformSetting;
use App\Models\SubscriptionPlan;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();

    PlatformSetting::factory()->create([
        'key' => 'monetization_enabled',
        'value' => false,
        'updated_by' => null,
    ]);
});

test('index lists all plans', function () {
    SubscriptionPlan::factory()->count(3)->create();

    $this->actingAs($this->admin)
        ->get(route('admin.settings.plans.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/settings/plans/index')
            ->has('plans', 3)
        );
});

test('index passes monetization_enabled flag', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.settings.plans.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('monetizationEnabled')
            ->where('monetizationEnabled', false)
        );
});

test('edit renders plan with billing periods and answer depths', function () {
    $plan = SubscriptionPlan::factory()->create();

    $this->actingAs($this->admin)
        ->get(route('admin.settings.plans.edit', $plan))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/settings/plans/edit')
            ->has('plan')
            ->has('billingPeriods')
            ->has('answerDepths')
        );
});

test('update changes plan details', function () {
    $plan = SubscriptionPlan::factory()->create([
        'display_name' => 'Old Name',
        'price_ngn' => 100000,
        'billing_period' => BillingPeriod::Monthly,
    ]);

    $this->actingAs($this->admin)
        ->put(route('admin.settings.plans.update', $plan), [
            'display_name' => 'New Name',
            'price_ngn' => 250000,
            'billing_period' => 'yearly',
            'features' => [
                'daily_ocr' => 10,
                'daily_ai_messages' => 50,
                'daily_gradings' => 5,
                'answer_depths' => ['quick', 'standard'],
            ],
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.settings.plans.index'));

    $plan->refresh();
    expect($plan->display_name)->toBe('New Name');
    expect($plan->price_ngn)->toBe(250000);
    expect($plan->billing_period)->toBe(BillingPeriod::Yearly);
    expect($plan->features['answer_depths'])->toBe(['quick', 'standard']);
});

test('update validates features array', function () {
    $plan = SubscriptionPlan::factory()->create();

    $this->actingAs($this->admin)
        ->put(route('admin.settings.plans.update', $plan), [
            'display_name' => 'Test',
            'price_ngn' => 100000,
            'billing_period' => 'monthly',
            'is_active' => true,
        ])
        ->assertSessionHasErrors('features');
});

test('update validates answer_depths not empty', function () {
    $plan = SubscriptionPlan::factory()->create();

    $this->actingAs($this->admin)
        ->put(route('admin.settings.plans.update', $plan), [
            'display_name' => 'Test',
            'price_ngn' => 100000,
            'billing_period' => 'monthly',
            'features' => [
                'daily_ocr' => 10,
                'daily_ai_messages' => 50,
                'daily_gradings' => 5,
                'answer_depths' => [],
            ],
            'is_active' => true,
        ])
        ->assertSessionHasErrors('features.answer_depths');
});

test('update requires manage_subscriptions permission', function () {
    $plan = SubscriptionPlan::factory()->create();
    $reviewer = User::factory()->contentReviewer()->create();

    $this->actingAs($reviewer)
        ->put(route('admin.settings.plans.update', $plan), [
            'display_name' => 'Test',
            'price_ngn' => 100000,
            'billing_period' => 'monthly',
            'features' => [
                'daily_ocr' => 10,
                'daily_ai_messages' => 50,
                'daily_gradings' => 5,
                'answer_depths' => ['quick'],
            ],
            'is_active' => true,
        ])
        ->assertForbidden();
});

test('guests cannot access plan routes', function () {
    $plan = SubscriptionPlan::factory()->create();

    $this->get(route('admin.settings.plans.index'))->assertRedirect(route('login'));
    $this->get(route('admin.settings.plans.edit', $plan))->assertRedirect(route('login'));
    $this->put(route('admin.settings.plans.update', $plan))->assertRedirect(route('login'));
});
