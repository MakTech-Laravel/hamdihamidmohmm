<?php

use App\Enums\JobPostStatus;
use App\Models\JobPost;
use App\Models\User;
use Database\Seeders\JobTaxonomySeeder;

beforeEach(function () {
    $this->seed(JobTaxonomySeeder::class);
});

/**
 * @return array<string, mixed>
 */
function careerPortalJobPayload(array $overrides = []): array
{
    return [
        'title' => 'Career Portal Role',
        'category' => 'others',
        'location' => 'khartoum',
        'employment_type' => 'full_time',
        'experience_level' => 'Mid Level',
        'description' => 'A role with an external career portal link.',
        'publish' => false,
        ...$overrides,
    ];
}

test('employers can save a company career portal link on create', function () {
    $employer = User::factory()->employer()->create();

    $this->actingAs($employer)
        ->post(route('employer.jobs.store'), careerPortalJobPayload([
            'career_portal_url' => 'https://careers.example.com/jobs/frontend',
        ]))
        ->assertRedirect(route('employer.jobs'));

    $job = JobPost::query()->first();

    expect($job)->not->toBeNull()
        ->and($job->career_portal_url)->toBe('https://careers.example.com/jobs/frontend');
});

test('employers can update and clear a company career portal link', function () {
    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Career Portal Role',
        'category' => 'others',
        'location' => 'khartoum',
        'employment_type' => 'full_time',
        'experience_level' => 'Mid Level',
        'status' => JobPostStatus::Draft,
        'career_portal_url' => 'https://careers.example.com/jobs/old',
    ]);

    $this->actingAs($employer)
        ->put(route('employer.jobs.update', $job), careerPortalJobPayload([
            'title' => $job->title,
            'career_portal_url' => 'https://careers.example.com/jobs/new',
        ]))
        ->assertRedirect(route('employer.jobs'));

    expect($job->fresh()->career_portal_url)->toBe('https://careers.example.com/jobs/new');

    $this->actingAs($employer)
        ->put(route('employer.jobs.update', $job), careerPortalJobPayload([
            'title' => $job->title,
            'career_portal_url' => '',
        ]))
        ->assertRedirect(route('employer.jobs'));

    expect($job->fresh()->career_portal_url)->toBeNull();
});

test('invalid company career portal urls are rejected', function () {
    $employer = User::factory()->employer()->create();

    $this->actingAs($employer)
        ->post(route('employer.jobs.store'), careerPortalJobPayload([
            'career_portal_url' => 'not-a-url',
        ]))
        ->assertSessionHasErrors('career_portal_url');
});

test('public job show includes career portal url when set', function () {
    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'slug' => 'career-portal-public-role',
        'status' => JobPostStatus::Active,
        'career_portal_url' => 'https://careers.example.com/jobs/public',
    ]);

    $this->get(route('jobs.show', $job->slug))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('frontend/job-show')
            ->where('job.career_portal_url', 'https://careers.example.com/jobs/public')
            ->where('translations', fn ($translations) => ($translations['job_detail.open_in_company_portal'] ?? null) === 'Open in company portal'
                && ($translations['employer.job_editor.field.career_portal_url'] ?? null) === 'Company Career Portal Link'));
});

test('public job show omits empty career portal url', function () {
    $job = JobPost::factory()->create([
        'slug' => 'no-career-portal-role',
        'status' => JobPostStatus::Active,
        'career_portal_url' => null,
    ]);

    $this->get(route('jobs.show', $job->slug))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('frontend/job-show')
            ->where('job.career_portal_url', null));
});

test('employer job editor receives career portal url', function () {
    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'career_portal_url' => 'https://careers.example.com/jobs/edit',
    ]);

    $this->actingAs($employer)
        ->get(route('employer.jobs.edit', $job))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/User/EmployerJobEditor')
            ->where('job.career_portal_url', 'https://careers.example.com/jobs/edit'));
});
