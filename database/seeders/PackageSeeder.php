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
        $packages = [
            EmployerPackage::Starter->value => ['price' => 0, 'job_credits' => 3, 'featured_credits' => 0],
            EmployerPackage::Professional->value => ['price' => 299, 'job_credits' => 15, 'featured_credits' => 2],
            EmployerPackage::Premium->value => ['price' => 799, 'job_credits' => 40, 'featured_credits' => 8],
            EmployerPackage::Enterprise->value => ['price' => 1499, 'job_credits' => 999, 'featured_credits' => 30],
        ];

        foreach ($packages as $slug => $meta) {
            Package::query()->updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => EmployerPackage::from($slug)->label(),
                    'price' => $meta['price'],
                    'currency' => 'AED',
                    'billing_period' => 'month',
                    'job_credits' => $meta['job_credits'],
                    'featured_credits' => $meta['featured_credits'],
                    'is_active' => true,
                ],
            );
        }
    }
}
