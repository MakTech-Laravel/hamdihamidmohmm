<?php

use Database\Seeders\PackageSeeder;

test('pricing page can be rendered', function () {
    $this->get(route('pricing'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('frontend/pricing'));
});

test('pricing page shares package translations', function () {
    $this->get(route('pricing'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('translations')
            ->where('translations', fn ($translations) => ($translations['pricing.title'] ?? null) === 'Choose the Right Package'
                && ($translations['pricing.business.name'] ?? null) === 'Business Package'
                && ($translations['pricing.enterprise.name'] ?? null) === 'Enterprise'));
});

test('pricing page shows seeded public packages from the database', function () {
    $this->seed(PackageSeeder::class);

    $this->get(route('pricing'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('frontend/pricing')
            ->has('packages', 3)
            ->where('packages.0.name', 'Single Posting')
            ->where('packages.0.price', 299)
            ->where('packages.0.currency', 'SDG')
            ->where('packages.1.name', 'Business Package')
            ->where('packages.1.price', 999)
            ->where('packages.1.is_featured', true)
            ->where('packages.2.name', 'Enterprise')
            ->where('packages.2.price', 1199)
            ->where('packages.2.description', 'pricing.packages.enterprise.description')
            ->where('packages.2.features.0.key', 'pricing.feature.thirty_jobs'));
});
