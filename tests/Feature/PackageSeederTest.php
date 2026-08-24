<?php

use App\Enums\EmployerPackage;
use App\Models\Package;
use Database\Seeders\PackageSeeder;

test('the package seeder creates the Figma public pricing plans', function () {
    $this->seed(PackageSeeder::class);

    $single = Package::query()->where('slug', EmployerPackage::Professional->value)->first();
    $business = Package::query()->where('slug', EmployerPackage::Premium->value)->first();
    $enterprise = Package::query()->where('slug', EmployerPackage::Enterprise->value)->first();

    expect(Package::query()->count())->toBe(3)
        ->and(Package::query()->where('slug', EmployerPackage::Starter->value)->exists())->toBeFalse()
        ->and($single)->not->toBeNull()
        ->and($single?->name)->toBe('Single Posting')
        ->and($single?->price)->toBe(299)
        ->and($single?->currency)->toBe('SDG')
        ->and($single?->job_credits)->toBe(1)
        ->and($single?->is_public)->toBeTrue()
        ->and($single?->is_featured)->toBeFalse()
        ->and($single?->features)->toContain('pricing.feature.one_job')
        ->and($single?->excluded_features)->toContain('pricing.feature.multiple_jobs')
        ->and($business?->name)->toBe('Business Package')
        ->and($business?->price)->toBe(999)
        ->and($business?->is_featured)->toBeTrue()
        ->and($business?->is_public)->toBeTrue()
        ->and($enterprise?->name)->toBe('Enterprise')
        ->and($enterprise?->price)->toBe(1199)
        ->and($enterprise?->job_credits)->toBe(30)
        ->and($enterprise?->featured_credits)->toBe(10)
        ->and($enterprise?->features)->toContain('pricing.feature.thirty_jobs')
        ->and($enterprise?->description)->toBe('pricing.packages.enterprise.description');
});

test('the package seeder removes a leftover starter package', function () {
    Package::factory()->create([
        'slug' => EmployerPackage::Starter->value,
        'name' => EmployerPackage::Starter->label(),
        'is_public' => false,
    ]);

    $this->seed(PackageSeeder::class);

    expect(Package::query()->where('slug', EmployerPackage::Starter->value)->exists())->toBeFalse();
});
