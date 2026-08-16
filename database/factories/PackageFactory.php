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
            'description' => null,
            'price' => fake()->randomElement([299, 999, 1199]),
            'currency' => 'SAR',
            'billing_period' => 'month',
            'job_credits' => fake()->randomElement([1, 15, 30]),
            'featured_credits' => fake()->randomElement([0, 2, 10]),
            'features' => ['pricing.feature.one_job'],
            'excluded_features' => [],
            'is_active' => true,
            'is_featured' => false,
            'is_public' => true,
            'sort_order' => fake()->numberBetween(1, 10),
        ];
    }
}
