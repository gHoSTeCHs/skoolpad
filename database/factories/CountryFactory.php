<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Country>
 */
class CountryFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->country(),
            'code' => fake()->unique()->countryCode(),
            'currency_code' => fake()->currencyCode(),
        ];
    }

    public function nigeria(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Nigeria',
            'code' => 'NG',
            'currency_code' => 'NGN',
        ]);
    }
}
