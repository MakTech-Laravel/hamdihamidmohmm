<?php

use App\Enums\EmployerPackage;
use App\Models\Package;
use App\Models\User;
use Database\Seeders\PackageSeeder;

test('admins can view seeded Figma packages', function () {
    $this->seed(PackageSeeder::class);
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.packages.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/Admin/PackagesPricing')
            ->has('packages', 3)
            ->where('stats.most_popular', 'Business Package')
            ->where('packages.0.currency', 'SDG')
            ->where('packages.1.currency', 'SDG')
            ->where('packages.2.currency', 'SDG')
            ->where('packages', fn ($packages) => collect($packages)->pluck('name')->doesntContain('Starter')
                && collect($packages)->contains('name', 'Single Posting')
                && collect($packages)->contains('name', 'Business Package')
                && collect($packages)->contains('name', 'Enterprise')
                && collect($packages)->contains('price', 1500)
                && collect($packages)->contains('price', 2500)
                && collect($packages)->contains('price', 5000)
                && collect($packages)->contains(fn ($package) => $package['name'] === 'Single Posting'
                    && $package['description'] === 'Perfect for businesses with occasional hiring needs.')
                && collect($packages)->contains(fn ($package) => $package['name'] === 'Business Package'
                    && $package['description'] === 'Ideal for growing companies with regular recruitment.')));
});

test('admins can update a package and the public pricing page reflects it', function () {
    $this->seed(PackageSeeder::class);
    $admin = User::factory()->admin()->create();
    $package = Package::query()->where('slug', EmployerPackage::Professional->value)->firstOrFail();

    $this->actingAs($admin)
        ->put(route('admin.packages.update', $package), [
            'slug' => $package->slug,
            'name' => 'Single Posting Plus',
            'description' => 'Updated public description.',
            'price' => 350,
            'currency' => 'SDG',
            'billing_period' => 'month',
            'job_credits' => 2,
            'featured_credits' => 0,
            'features' => "One Job Posting\n30 Days Active Visibility",
            'excluded_features' => 'Multiple Job Postings',
            'sort_order' => 1,
            'is_active' => true,
            'is_featured' => false,
            'is_public' => true,
        ])
        ->assertRedirect();

    expect($package->fresh()?->features)->toContain('pricing.feature.one_job')
        ->and($package->fresh()?->excluded_features)->toContain('pricing.feature.multiple_jobs');

    $this->get(route('pricing'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('frontend/pricing')
            ->where('packages.0.name', 'Single Posting Plus')
            ->where('packages.0.price', 350)
            ->where('packages.0.description', 'Updated public description.'));
});

test('admins updating a package without a valid currency default to SDG', function () {
    $this->seed(PackageSeeder::class);
    $admin = User::factory()->admin()->create();
    $package = Package::query()->where('slug', EmployerPackage::Professional->value)->firstOrFail();

    $this->actingAs($admin)
        ->put(route('admin.packages.update', $package), [
            'slug' => $package->slug,
            'name' => $package->name,
            'description' => $package->description,
            'price' => $package->price,
            'currency' => 'XX',
            'billing_period' => $package->billing_period,
            'job_credits' => $package->job_credits,
            'featured_credits' => $package->featured_credits,
            'features' => implode("\n", $package->features ?? []),
            'excluded_features' => implode("\n", $package->excluded_features ?? []),
            'sort_order' => $package->sort_order,
            'is_active' => true,
            'is_featured' => false,
            'is_public' => true,
        ])
        ->assertRedirect();

    expect($package->fresh()?->currency)->toBe('SDG');
});

test('admins can create a package without providing a slug', function () {
    $this->seed(PackageSeeder::class);
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->from(route('admin.packages.index'))
        ->post(route('admin.packages.store'), [
            'name' => 'Growth Plan',
            'slug' => '',
            'description' => 'For growing teams.',
            'price' => 499,
            'currency' => 'SDG',
            'billing_period' => 'month',
            'job_credits' => 5,
            'featured_credits' => 1,
            'features' => "One Job Posting\nApplicant Management",
            'excluded_features' => '',
            'sort_order' => 4,
            'is_active' => true,
            'is_featured' => false,
            'is_public' => true,
        ])
        ->assertRedirect();

    $package = Package::query()->where('name', 'Growth Plan')->first();

    expect($package)->not->toBeNull()
        ->and($package?->slug)->toBe('growth-plan')
        ->and($package?->price)->toBe(499)
        ->and($package?->is_public)->toBeTrue()
        ->and($package?->features)->toContain('pricing.feature.one_job');
});

test('admins can archive a public package without deleting it', function () {
    $this->seed(PackageSeeder::class);
    $admin = User::factory()->admin()->create();
    $package = Package::query()->where('slug', EmployerPackage::Professional->value)->firstOrFail();

    $this->actingAs($admin)
        ->delete(route('admin.packages.destroy', $package))
        ->assertRedirect();

    expect($package->fresh())
        ->not->toBeNull()
        ->and($package->fresh()?->is_active)->toBeFalse();
});

test('admins can permanently delete a public package', function () {
    $this->seed(PackageSeeder::class);
    $admin = User::factory()->admin()->create();
    $package = Package::query()->where('slug', EmployerPackage::Professional->value)->firstOrFail();

    $this->actingAs($admin)
        ->delete(route('admin.packages.destroy', $package), [
            'permanent' => true,
        ])
        ->assertRedirect();

    expect(Package::query()->whereKey($package->id)->exists())->toBeFalse();
});

test('admins can permanently delete an archived package', function () {
    $admin = User::factory()->admin()->create();
    $starter = Package::factory()->create([
        'slug' => EmployerPackage::Starter->value,
        'name' => EmployerPackage::Starter->label(),
        'price' => 0,
        'is_active' => false,
        'is_public' => false,
    ]);

    $this->actingAs($admin)
        ->delete(route('admin.packages.destroy', $starter), [
            'permanent' => true,
        ])
        ->assertRedirect();

    expect(Package::query()->whereKey($starter->id)->exists())->toBeFalse();
});

test('admins can save packages priced in SDG', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->from(route('admin.packages.index'))
        ->post(route('admin.packages.store'), [
            'name' => 'Starter Plus+',
            'slug' => 'starter-plus-sdg',
            'description' => 'Local currency package.',
            'price' => 1500,
            'currency' => 'SDG',
            'billing_period' => 'month',
            'job_credits' => 3,
            'featured_credits' => 0,
            'features' => 'One Job Posting',
            'excluded_features' => '',
            'sort_order' => 8,
            'is_active' => true,
            'is_featured' => false,
            'is_public' => true,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors()
        ->assertSessionHas('success');

    expect(Package::query()->where('slug', 'starter-plus-sdg')->first()?->currency)->toBe('SDG');
});
