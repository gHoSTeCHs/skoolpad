<?php

namespace Database\Factories;

use App\Enums\SubscriptionStatus;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\UserSubscription>
 */
class UserSubscriptionFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'plan_id' => SubscriptionPlan::factory(),
            'paid_by' => null,
            'status' => SubscriptionStatus::Active,
            'past_due_since' => null,
            'paused_reason' => null,
            'paystack_subscription_code' => null,
            'paystack_customer_code' => null,
            'current_period_start' => now(),
            'current_period_end' => now()->addMonth(),
            'cancelled_at' => null,
        ];
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => SubscriptionStatus::Cancelled,
            'cancelled_at' => now(),
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => SubscriptionStatus::Expired,
            'current_period_start' => now()->subMonth(),
            'current_period_end' => now()->subDay(),
        ]);
    }
}
