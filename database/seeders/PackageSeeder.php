<?php

namespace Database\Seeders;

use App\Enums\EmployerPackage;
use App\Models\Package;
use Illuminate\Database\Seeder;

class PackageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Package::query()->where('slug', EmployerPackage::Starter->value)->delete();

        foreach ($this->packages() as $slug => $attributes) {
            Package::query()->updateOrCreate(
                ['slug' => $slug],
                $attributes,
            );
        }
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    private function packages(): array
    {
        return [
            EmployerPackage::Professional->value => [
                'name' => EmployerPackage::Professional->label(),
                'description' => 'pricing.packages.professional.description',
                'price' => 299,
                'currency' => 'SGD',
                'billing_period' => 'month',
                'job_credits' => 1,
                'featured_credits' => 0,
                'features' => [
                    'pricing.feature.one_job',
                    'pricing.feature.visibility_30',
                    'pricing.feature.receive_apps',
                    'pricing.feature.applicant_mgmt',
                ],
                'excluded_features' => [
                    'pricing.feature.multiple_jobs',
                    'pricing.feature.advanced_mgmt',
                    'pricing.feature.dedicated_support',
                    'pricing.feature.priority_listing',
                ],
                'is_active' => true,
                'is_featured' => false,
                'is_public' => true,
                'sort_order' => 1,
            ],
            EmployerPackage::Premium->value => [
                'name' => EmployerPackage::Premium->label(),
                'description' => 'pricing.packages.premium.description',
                'price' => 999,
                'currency' => 'SGD',
                'billing_period' => 'month',
                'job_credits' => 15,
                'featured_credits' => 2,
                'features' => [
                    'pricing.feature.one_job',
                    'pricing.feature.visibility_30',
                    'pricing.feature.receive_apps',
                    'pricing.feature.applicant_mgmt',
                    'pricing.feature.multiple_jobs',
                    'pricing.feature.advanced_mgmt',
                    'pricing.feature.dedicated_support',
                    'pricing.feature.priority_listing',
                ],
                'excluded_features' => [],
                'is_active' => true,
                'is_featured' => true,
                'is_public' => true,
                'sort_order' => 2,
            ],
            EmployerPackage::Enterprise->value => [
                'name' => EmployerPackage::Enterprise->label(),
                'description' => 'pricing.packages.enterprise.description',
                'price' => 1199,
                'currency' => 'SGD',
                'billing_period' => 'month',
                'job_credits' => 30,
                'featured_credits' => 10,
                'features' => [
                    'pricing.feature.thirty_jobs',
                    'pricing.feature.full_analytics',
                    'pricing.feature.account_manager',
                    'pricing.feature.featured_credits',
                    'pricing.feature.validity_60',
                ],
                'excluded_features' => [],
                'is_active' => true,
                'is_featured' => false,
                'is_public' => true,
                'sort_order' => 3,
            ],
        ];
    }
}
