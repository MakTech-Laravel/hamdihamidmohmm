<?php

use App\Enums\EmployerPackage;
use App\Models\Package;
use App\Models\User;
use Database\Seeders\PackageSeeder;

test('home page can be rendered', function () {
    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('frontend/home'));
});

test('authenticated users can still view the home page', function () {
    $user = User::factory()->jobSeeker()->create();

    $this->actingAs($user)
        ->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('frontend/home'));
});

test('home page only shows active public packages', function () {
    $this->seed(PackageSeeder::class);

    Package::query()
        ->where('slug', EmployerPackage::Professional->value)
        ->update(['is_active' => false]);

    Package::factory()->create([
        'name' => 'Hidden Draft',
        'is_active' => true,
        'is_public' => false,
        'sort_order' => 99,
    ]);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('frontend/home')
            ->has('packages', 2)
            ->where('packages', fn ($packages) => collect($packages)->pluck('name')->doesntContain('Single Posting')
                && collect($packages)->pluck('name')->doesntContain('Hidden Draft')
                && collect($packages)->pluck('name')->doesntContain('Starter')
                && collect($packages)->pluck('name')->contains('Business Package')
                && collect($packages)->pluck('name')->contains('Enterprise')));
});
