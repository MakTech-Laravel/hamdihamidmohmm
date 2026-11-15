<?php

use App\Enums\EmployerPackage;
use App\Enums\JobApplicationStatus;
use App\Enums\JobPostStatus;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\Package;
use App\Models\User;
use Database\Seeders\PackageSeeder;
use Illuminate\Support\Facades\Cache;

test('website root opens the jobs page by default', function () {
    $this->get('/')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('frontend/jobs')
            ->has('jobs'));

    $this->get('/jobs')
        ->assertRedirect('/');
});

test('discover page can be rendered', function () {
    $this->get(route('discover'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('frontend/home')
            ->has('recommendedJobs'));
});

test('legacy home path redirects to discover', function () {
    $this->get('/home')
        ->assertRedirect('/discover');
});

test('authenticated users can still view the discover page', function () {
    $user = User::factory()->jobSeeker()->create([
        'name' => 'Amina Seeker',
    ]);

    $this->actingAs($user)
        ->get(route('discover'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('frontend/home')
            ->where('auth.user.name', 'Amina Seeker')
            ->where('auth.user.dashboard_url', route('job-seeker.dashboard', absolute: false))
            ->where('auth.user.profile_url', route('job-seeker.profile', absolute: false)));
});

test('discover page only shows active public packages', function () {
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

    $this->get(route('discover'))
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

test('discover page shows recommended active jobs dynamically', function () {
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

    $this->get(route('discover'))
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

test('discover page stats are loaded from the database', function () {
    Cache::forget('frontend.portal_stats');

    $employer = User::factory()->employer()->create();
    $seekers = User::factory()->jobSeeker()->count(5)->create();

    $activeJobs = JobPost::factory()->count(2)->create([
        'employer_id' => $employer->id,
        'status' => JobPostStatus::Active,
    ]);

    JobPost::factory()->create([
        'employer_id' => $employer->id,
        'status' => JobPostStatus::Draft,
    ]);

    foreach ($seekers->take(4) as $index => $seeker) {
        JobApplication::factory()->create([
            'job_post_id' => $activeJobs[$index % $activeJobs->count()]->id,
            'job_seeker_id' => $seeker->id,
        ]);
    }

    JobApplication::factory()->create([
        'job_post_id' => $activeJobs->first()->id,
        'job_seeker_id' => $seekers->last()->id,
        'status' => JobApplicationStatus::Hired,
        'updated_at' => now(),
    ]);

    $this->get(route('discover'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('frontend/home')
            ->where('stats.active_jobs', '2+')
            ->where('stats.companies', '1+')
            ->where('stats.seekers', '5+')
            ->where('stats.applications', '5+')
            ->where('stats.hired_today', '+1'));
});
