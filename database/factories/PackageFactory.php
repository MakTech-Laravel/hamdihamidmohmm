<?php

namespace Database\Factories;

use App\Enums\EmployerPackage;
use App\Models\Package;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Package>
 */
class PackageFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $package = fake()->randomElement(EmployerPackage::cases());

        return [
            'slug' => $package->value.'-'.fake()->unique()->numerify('###'),
            'name' => $package->label(),
            'price' => fake()->randomElement([0, 299, 799, 1499]),
            'currency' => 'AED',
            'billing_period' => 'month',
            'job_credits' => fake()->randomElement([5, 20, 50, 999]),
            'featured_credits' => fake()->randomElement([0, 2, 8, 20]),
            'is_active' => true,
        ];
    }
}
