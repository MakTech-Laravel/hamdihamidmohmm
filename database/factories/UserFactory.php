<?php

namespace Database\Factories;

use App\Enums\EmployerAccountStatus;
use App\Enums\EmployerPackage;
use App\Enums\EmployerVerificationStatus;
use App\Enums\UserRole;
use App\Models\User;
use App\Support\RoleAssigner;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'company_name' => null,
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'avatar' => null,
            'password' => static::$password ??= Hash::make('password'),
            'role' => UserRole::JobSeeker,
            'remember_token' => Str::random(10),
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (User $user): void {
            RoleAssigner::assign($user, $user->role ?? UserRole::JobSeeker);
        });
    }

    public function jobSeeker(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::JobSeeker,
            'company_name' => null,
        ]);
    }

    public function employer(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::Employer,
            'company_name' => fake()->company(),
            'name' => fake()->name(),
            'contact_name' => fake()->name(),
            'industry' => fake()->randomElement([
                'Technology',
                'Construction',
                'Finance',
                'Retail',
                'Logistics',
                'Healthcare',
                'Media',
            ]),
            'verification_status' => EmployerVerificationStatus::Approved,
            'account_status' => EmployerAccountStatus::Active,
            'package' => EmployerPackage::Professional,
            'verified_at' => now(),
        ]);
    }

    public function pendingEmployer(): static
    {
        return $this->employer()->state(fn (array $attributes) => [
            'verification_status' => EmployerVerificationStatus::Pending,
            'account_status' => EmployerAccountStatus::PendingVerification,
            'verified_at' => null,
            'rejection_reason' => null,
        ]);
    }

    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::Admin,
            'company_name' => null,
        ]);
    }

    public function superAdmin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::SuperAdmin,
            'company_name' => null,
        ]);
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Indicate that the model has two-factor authentication configured.
     */
    public function withTwoFactor(): static
    {
        return $this->state(fn (array $attributes) => [
            'two_factor_secret' => encrypt('secret'),
            'two_factor_recovery_codes' => encrypt(json_encode(['recovery-code-1'])),
            'two_factor_confirmed_at' => now(),
        ]);
    }
}
