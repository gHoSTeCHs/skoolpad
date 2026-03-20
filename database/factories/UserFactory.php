<?php

namespace Database\Factories;

use App\Enums\AccountType;
use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
            'account_type' => AccountType::Student,
            'role' => UserRole::Student,
            'secondary_role' => null,
            'avatar_path' => null,
            'app_pin_hash' => null,
            'app_preferences' => [],
            'is_active' => true,
            'last_login_at' => null,
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function withTwoFactor(): static
    {
        return $this->state(fn (array $attributes) => [
            'two_factor_secret' => encrypt('secret'),
            'two_factor_recovery_codes' => encrypt(json_encode(['recovery-code-1'])),
            'two_factor_confirmed_at' => now(),
        ]);
    }

    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::SuperAdmin,
        ]);
    }

    public function contentManager(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::ContentManager,
        ]);
    }

    public function institutionModerator(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::InstitutionModerator,
        ]);
    }

    public function contentReviewer(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::ContentReviewer,
        ]);
    }

    public function staff(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => fake()->randomElement(UserRole::staffRoles()),
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    public function parent(): static
    {
        return $this->state(fn (array $attributes) => [
            'account_type' => AccountType::Parent,
        ]);
    }
}
