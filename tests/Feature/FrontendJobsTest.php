<?php

use App\Enums\JobPostStatus;
use App\Models\JobPost;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

test('jobs page can be rendered', function () {
    $this->get(route('jobs'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('frontend/jobs'));
});

test('jobs page shares locale translations', function () {
    $this->get(route('jobs'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('translations')
            ->where('translations', fn ($translations) => ($translations['jobs_page.title'] ?? null) === 'Find Your Next Opportunity'));
});

test('jobs listing prefers the job logo then falls back to the company logo', function () {
    Storage::fake('public');

    $employer = User::factory()->employer()->create([
        'company_name' => 'Action Against Hunger Spain',
    ]);
    $companyLogoPath = 'company-logos/'.$employer->id.'/company.png';
    Storage::disk('public')->put($companyLogoPath, 'company');
    $employer->forceFill(['company_logo_path' => $companyLogoPath])->save();

    $withJobLogo = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Education Officer',
        'slug' => 'education-officer',
        'status' => JobPostStatus::Active,
    ]);
    $jobLogoPath = 'job-logos/'.$employer->id.'/job.png';
    Storage::disk('public')->put($jobLogoPath, 'job');
    $withJobLogo->forceFill(['logo_path' => $jobLogoPath])->save();

    $companyOnly = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Field Coordinator',
        'slug' => 'field-coordinator',
        'status' => JobPostStatus::Active,
        'logo_path' => null,
    ]);

    $this->get(route('jobs'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('frontend/jobs')
            ->where('jobs.data', fn ($jobs) => collect($jobs)->contains(
                fn ($job) => $job['slug'] === $withJobLogo->slug
                    && $job['logo_url'] === '/storage/'.$jobLogoPath
            ) && collect($jobs)->contains(
                fn ($job) => $job['slug'] === $companyOnly->slug
                    && $job['logo_url'] === '/storage/'.$companyLogoPath
            )));
});

test('jobs page can filter by searchable location input', function () {
    $employer = User::factory()->employer()->create();

    JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Riyadh Role',
        'slug' => 'riyadh-role',
        'location' => 'Riyadh, Saudi Arabia',
        'status' => JobPostStatus::Active,
    ]);

    JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Dubai Role',
        'slug' => 'dubai-role',
        'location' => 'Dubai, UAE',
        'status' => JobPostStatus::Active,
    ]);

    $this->get(route('jobs', ['location' => 'riyadh']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('frontend/jobs')
            ->where('filters.location', 'riyadh')
            ->has('jobs.data', 1)
            ->where('jobs.data.0.slug', 'riyadh-role'));
});
