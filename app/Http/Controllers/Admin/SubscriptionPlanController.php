<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AnswerDepthLevel;
use App\Enums\BillingPeriod;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSubscriptionPlanRequest;
use App\Models\PlatformSetting;
use App\Models\SubscriptionPlan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionPlanController extends Controller
{
    public function index(): Response
    {
        Gate::authorize('viewPlans', SubscriptionPlan::class);

        $plans = SubscriptionPlan::query()
            ->orderBy('price_ngn')
            ->get()
            ->map(fn (SubscriptionPlan $plan) => array_merge(
                $plan->toArray(),
                [
                    'billing_period_label' => $plan->billing_period->label(),
                    'price_formatted' => number_format($plan->price_ngn / 100, 2),
                ]
            ));

        $monetizationSetting = PlatformSetting::query()->where('key', 'monetization_enabled')->first();

        return Inertia::render('admin/settings/plans/index', [
            'plans' => $plans,
            'monetizationEnabled' => (bool) ($monetizationSetting?->value ?? false),
        ]);
    }

    public function edit(SubscriptionPlan $plan): Response
    {
        Gate::authorize('updatePlan', $plan);

        return Inertia::render('admin/settings/plans/edit', [
            'plan' => $plan,
            'billingPeriods' => BillingPeriod::toSelectOptions(),
            'answerDepths' => AnswerDepthLevel::toSelectOptions(),
        ]);
    }

    public function update(UpdateSubscriptionPlanRequest $request, SubscriptionPlan $plan): RedirectResponse
    {
        Gate::authorize('updatePlan', $plan);

        $plan->update($request->validated());

        return to_route('admin.settings.plans.index')->with('success', 'Subscription plan updated successfully.');
    }
}
