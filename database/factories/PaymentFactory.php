<?php

namespace Database\Factories;

use App\Enums\PaymentStatus;
use App\Models\Package;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'employer_id' => User::factory()->employer(),
            'package_id' => Package::factory(),
            'amount' => fake()->randomElement([299, 799, 1499, 2499]),
            'currency' => 'AED',
            'method' => fake()->randomElement(['bank_transfer', 'card', 'invoice']),
            'status' => PaymentStatus::Completed,
            'reference' => 'PAY-'.Str::upper(Str::random(8)),
            'paid_at' => now(),
        ];
    }
}
