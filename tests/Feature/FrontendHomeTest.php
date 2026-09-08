<?php

use App\Enums\EmployerPackage;
use App\Enums\JobPostStatus;
use App\Models\JobPost;
use App\Models\Package;
use App\Models\User;
use Database\Seeders\PackageSeeder;

test('home page can be rendered', function () {
    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('frontend/home')
            ->has('recommendedJobs'));
});

test('authenticated users can still view the home page', function () {
    $user = User::factory()->jobSeeker()->create([
        'name' => 'Amina Seeker',
    ]);

    $this->actingAs($user)
        ->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('frontend/home')
            ->where('auth.user.name', 'Amina Seeker')
            ->where('auth.user.dashboard_url', route('job-seeker.dashboard', absolute: false))
            ->where('auth.user.profile_url', route('job-seeker.profile', absolute: false)));
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

test('home page shows recommended active jobs dynamically', function () {
    $employer = User::factory()->employer()->create(['company_name' => 'Nova Labs']);

    JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Recommended Laravel Engineer',
        'status' => JobPostStatus::Active,
        'employment_type' => 'Full-time',
        'location' => 'Riyadh',
        'experience_level' => 'Senior',
        'salary_range' => 'SAR 15,000 - 20,000',
        'featured' => true,
    ]);

    JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Draft Should Hide',
        'status' => JobPostStatus::Draft,
    ]);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('frontend/home')
            ->has('recommendedJobs', 1)
            ->where('recommendedJobs.0.title', 'Recommended Laravel Engineer')
            ->where('recommendedJobs.0.company', 'Nova Labs')
            ->where('recommendedJobs.0.type', 'Full-time')
            ->where('recommendedJobs.0.location', 'Riyadh')
            ->missing('featuredJobs'));
});
