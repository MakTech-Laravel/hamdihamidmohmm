<?php

use App\Enums\JobPostStatus;
use App\Enums\JobTaxonomyType;
use App\Models\JobPost;
use App\Models\JobTaxonomy;
use App\Models\User;
use Database\Seeders\JobTaxonomySeeder;

test('jobs page exposes admin managed filter options', function () {
    $this->seed(JobTaxonomySeeder::class);

    $this->get(route('jobs'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('frontend/jobs')
            ->has('filterOptions.countries')
            ->has('filterOptions.dutyStations')
            ->has('filterOptions.positionAreas')
            ->has('filterOptions.employmentTypes')
            ->where('filterOptions.dutyStations', fn($items) => collect($items)->contains(
                fn($item) => ($item['value'] ?? null) === 'khartoum'
            )));
});

test('jobs page can filter by country duty station and position area slugs', function () {
    $this->seed(JobTaxonomySeeder::class);
    $employer = User::factory()->employer()->create();

    JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Khartoum Tech Role',
        'slug' => 'khartoum-tech-role',
        'country' => 'sudan',
        'location' => 'khartoum',
        'category' => 'technology',
        'employment_type' => 'full_time',
        'status' => JobPostStatus::Active,
    ]);

    JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Remote Design Role',
        'slug' => 'remote-design-role',
        'country' => 'remote',
        'location' => 'remote',
        'category' => 'design',
        'employment_type' => 'remote',
        'status' => JobPostStatus::Active,
    ]);

    $this->get(route('jobs', [
        'country' => 'sudan',
        'location' => 'khartoum',
        'category' => 'technology',
        'types' => ['full_time'],
    ]))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('frontend/jobs')
            ->where('filters.country', 'sudan')
            ->where('filters.location', 'khartoum')
            ->where('filters.category', 'technology')
            ->has('jobs.data', 1)
            ->where('jobs.data.0.slug', 'khartoum-tech-role'));
});

test('employer job create rejects invalid taxonomy slugs', function () {
    $this->seed(JobTaxonomySeeder::class);
    $employer = User::factory()->employer()->create([
        'package' => 'enterprise',
    ]);

    $this->actingAs($employer)
        ->post(route('employer.jobs.store'), [
            'title' => 'Invalid Taxonomy Job',
            'category' => 'not-a-real-category',
            'location' => 'not-a-real-location',
            'country' => 'not-a-real-country',
            'employment_type' => 'not-a-real-type',
            'publish' => false,
        ])
        ->assertSessionHasErrors(['category', 'location', 'country', 'employment_type']);
});

test('employer job create accepts active taxonomy slugs', function () {
    $this->seed(JobTaxonomySeeder::class);
    $employer = User::factory()->employer()->create([
        'package' => 'enterprise',
    ]);

    expect(JobTaxonomy::isValidSlug(JobTaxonomyType::EmploymentType, 'full_time'))->toBeTrue();

    $this->actingAs($employer)
        ->post(route('employer.jobs.store'), [
            'title' => 'Taxonomy Job',
            'category' => 'technology',
            'location' => 'khartoum',
            'country' => 'sudan',
            'employment_type' => 'full_time',
            'experience_level' => 'Mid Level',
            'publish' => false,
        ])
        ->assertRedirect(route('employer.jobs'));

    $job = JobPost::query()->where('title', 'Taxonomy Job')->first();

    expect($job)->not->toBeNull()
        ->and($job?->category)->toBe('technology')
        ->and($job?->location)->toBe('khartoum')
        ->and($job?->country)->toBe('sudan')
        ->and($job?->employment_type)->toBe('full_time');
});
