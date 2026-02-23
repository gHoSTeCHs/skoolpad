<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AnswerDepthLevel;
use App\Enums\BillingPeriod;
use App\Http\Controllers\Controller;
use App\Models\PlatformSetting;
use App\Models\SubscriptionPlan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionPlanController extends Controller
{
    public function index(): Response
    {
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

        $monetizationSetting = PlatformSetting::where('key', 'monetization_enabled')->first();

        return Inertia::render('admin/settings/plans/index', [
            'plans' => $plans,
            'monetizationEnabled' => (bool) ($monetizationSetting?->value ?? false),
        ]);
    }

    public function edit(SubscriptionPlan $plan): Response
    {
        return Inertia::render('admin/settings/plans/edit', [
            'plan' => $plan,
            'billingPeriods' => BillingPeriod::toSelectOptions(),
            'answerDepths' => AnswerDepthLevel::toSelectOptions(),
        ]);
    }

    public function update(Request $request, SubscriptionPlan $plan): RedirectResponse
    {
        if (! $request->user()->role->hasPermission('manage_subscriptions')) {
            abort(403, 'You do not have permission to manage subscriptions.');
        }

        $validated = $request->validate([
            'display_name' => ['required', 'string', 'max:255'],
            'price_ngn' => ['required', 'integer', 'min:0'],
            'billing_period' => ['required', 'string', 'in:'.implode(',', array_column(BillingPeriod::cases(), 'value'))],
            'features' => ['required', 'array'],
            'features.daily_ocr' => ['required', 'integer', 'min:-1'],
            'features.daily_ai_messages' => ['required', 'integer', 'min:-1'],
            'features.daily_gradings' => ['required', 'integer', 'min:-1'],
            'features.answer_depths' => ['required', 'array', 'min:1'],
            'features.answer_depths.*' => ['required', 'string', 'in:'.implode(',', AnswerDepthLevel::values())],
            'is_active' => ['required', 'boolean'],
        ]);

        $plan->update($validated);

        return to_route('admin.settings.plans.index')->with('success', 'Subscription plan updated successfully.');
    }
}
