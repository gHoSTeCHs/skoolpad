<?php

namespace Database\Factories;

use App\Enums\BillingPeriod;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SubscriptionPlan>
 */
class SubscriptionPlanFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $planType = fake()->randomElement(['student', 'parent', 'institution']);

        return [
            'name' => $planType.'_'.fake()->word(),
            'display_name' => ucfirst($planType).' Plan',
            'plan_type' => $planType,
            'price_ngn' => fake()->randomElement([100000, 200000, 500000, 1000000]),
            'price_usd' => null,
            'billing_period' => fake()->randomElement(BillingPeriod::cases()),
            'paystack_plan_code' => null,
            'features' => ['practice_questions' => true, 'notes' => true],
            'max_children' => $planType === 'parent' ? fake()->numberBetween(1, 5) : null,
            'max_students' => $planType === 'institution' ? fake()->numberBetween(50, 500) : null,
            'max_lecturers' => $planType === 'institution' ? fake()->numberBetween(5, 50) : null,
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
