<?php

use App\Enums\JobPostStatus;
use App\Models\JobPost;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

test('jobs page can be rendered', function () {
    $this->get(route('jobs'))
        ->assertOk()
        ->assertInertia(fn($page) => $page->component('frontend/jobs'));
});

test('jobs page paginates thirty jobs per page', function () {
    JobPost::factory()->count(31)->create([
        'status' => JobPostStatus::Active,
    ]);

    $this->get(route('jobs'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('frontend/jobs')
            ->has('jobs.data', 30)
            ->where('jobs.per_page', 30)
            ->where('jobs.last_page', 2));
});

test('jobs page shares locale translations', function () {
    $this->get(route('jobs'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->has('translations')
            ->where('translations', fn($translations) => ($translations['jobs_page.title'] ?? null) === 'Find Your Next Opportunity'));
});

test('jobs listing prefers the job logo then falls back to the company logo', function () {
    Storage::fake('public');

    $employer = User::factory()->employer()->create([
        'company_name' => 'Action Against Hunger Spain',
    ]);
    $companyLogoPath = 'company-logos/' . $employer->id . '/company.png';
    Storage::disk('public')->put($companyLogoPath, 'company');
    $employer->forceFill(['company_logo_path' => $companyLogoPath])->save();

    $withJobLogo = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Education Officer',
        'slug' => 'education-officer',
        'status' => JobPostStatus::Active,
        'expires_at' => Carbon::parse('2026-12-24'),
    ]);
    $jobLogoPath = 'job-logos/' . $employer->id . '/job.png';
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
        ->assertInertia(fn($page) => $page
            ->component('frontend/jobs')
            ->where('jobs.data', fn($jobs) => collect($jobs)->contains(
                fn($job) => $job['slug'] === $withJobLogo->slug
                    && $job['logo_url'] === '/storage/' . $jobLogoPath
                    && $job['closing_date'] === '24 Dec 2026'
            ) && collect($jobs)->contains(
                fn($job) => $job['slug'] === $companyOnly->slug
                    && $job['logo_url'] === '/storage/' . $companyLogoPath
            )));
});

test('jobs page can filter by searchable location input', function () {
    $employer = User::factory()->employer()->create();

    JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Khartoum Role',
        'slug' => 'khartoum-role',
        'location' => 'Khartoum, Sudan',
        'status' => JobPostStatus::Active,
    ]);

    JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Port Sudan Role',
        'slug' => 'port-sudan-role',
        'location' => 'Port Sudan, Sudan',
        'status' => JobPostStatus::Active,
    ]);

    $this->get(route('jobs', ['location' => 'Khartoum']))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('frontend/jobs')
            ->where('filters.location', 'Khartoum')
            ->has('jobs.data', 1)
            ->where('jobs.data.0.slug', 'khartoum-role'));
});

test('jobs page can filter by category and employment type', function () {
    $employer = User::factory()->employer()->create();

    JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Full Time Tech Role',
        'slug' => 'full-time-tech-role',
        'category' => 'Technology',
        'employment_type' => 'Full-time',
        'location' => 'Dubai, UAE',
        'status' => JobPostStatus::Active,
    ]);

    JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Remote Design Role',
        'slug' => 'remote-design-role',
        'category' => 'Design',
        'employment_type' => 'Remote',
        'location' => 'Khartoum, Sudan',
        'status' => JobPostStatus::Active,
    ]);

    $this->get(route('jobs', [
        'category' => 'Technology',
        'types' => ['full_time'],
    ]))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('frontend/jobs')
            ->where('filters.category', 'Technology')
            ->where('filters.types', ['full_time'])
            ->has('jobs.data', 1)
            ->where('jobs.data.0.slug', 'full-time-tech-role')
            ->has('filterOptions.positionAreas')
            ->has('filterOptions.employmentTypes'));

    $this->get(route('jobs', ['types' => ['remote']]))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('frontend/jobs')
            ->has('jobs.data', 1)
            ->where('jobs.data.0.slug', 'remote-design-role'));
});

test('jobs page can search by job title and keep part-time listings when filtered', function () {
    $employer = User::factory()->employer()->create();

    JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Part Time Nurse',
        'slug' => 'part-time-nurse',
        'employment_type' => 'part_time',
        'status' => JobPostStatus::Active,
    ]);

    JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Full Time Engineer',
        'slug' => 'full-time-engineer',
        'employment_type' => 'Full-time',
        'status' => JobPostStatus::Active,
    ]);

    $this->get(route('jobs', ['search' => 'Nurse']))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('frontend/jobs')
            ->has('jobs.data', 1)
            ->where('jobs.data.0.slug', 'part-time-nurse'));

    $this->get(route('jobs', ['title' => 'Engineer']))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('frontend/jobs')
            ->has('jobs.data', 1)
            ->where('jobs.data.0.slug', 'full-time-engineer'));

    $this->get(route('jobs', ['types' => ['part_time']]))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('frontend/jobs')
            ->has('jobs.data', 1)
            ->where('jobs.data.0.slug', 'part-time-nurse'));
});
