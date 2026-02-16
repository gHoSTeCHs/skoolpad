<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\UserSubscription;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PaymentTransaction>
 */
class PaymentTransactionFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'subscription_id' => UserSubscription::factory(),
            'transaction_context' => null,
            'context_id' => null,
            'paystack_reference' => 'PAY_'.Str::random(16),
            'amount_kobo' => fake()->randomElement([200000, 500000, 1000000]),
            'currency' => 'NGN',
            'status' => 'success',
            'paystack_response' => null,
        ];
    }

    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'failed',
        ]);
    }
}
