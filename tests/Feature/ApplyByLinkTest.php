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
function applyByLinkEmployerPayload(array $overrides = []): array
{
    return [
        'title' => 'Apply By Link Role',
        'category' => 'others',
        'location' => 'khartoum',
        'employment_type' => 'full_time',
        'experience_level' => 'Mid Level',
        'description' => 'A role that may use an external apply link.',
        'publish' => false,
        ...$overrides,
    ];
}

/**
 * @return array<string, mixed>
 */
function applyByLinkAdminPayload(JobPost $job, array $overrides = []): array
{
    return [
        'title' => $job->title,
        'subtitle' => $job->subtitle,
        'category' => $job->category ?? 'others',
        'location' => $job->location ?? 'khartoum',
        'country' => $job->country ?? 'sudan',
        'employment_type' => $job->employment_type ?? 'full_time',
        'experience_level' => $job->experience_level ?? 'Mid Level',
        'salary_range' => $job->salary_range,
        'description' => $job->description,
        'requirements' => $job->requirements,
        'skills' => is_array($job->skills) ? implode(', ', $job->skills) : '',
        'expires_at' => $job->expires_at?->toDateString(),
        'status' => $job->status->value,
        'career_portal_url' => $job->career_portal_url,
        'apply_by_link' => (bool) $job->apply_by_link,
        ...$overrides,
    ];
}

test('employers can save and clear an apply by link url', function () {
    $employer = User::factory()->employer()->create();

    $this->actingAs($employer)
        ->post(route('employer.jobs.store'), applyByLinkEmployerPayload([
            'career_portal_url' => 'https://careers.example.com/jobs/frontend',
            'apply_by_link' => true,
        ]))
        ->assertRedirect(route('employer.jobs'));

    $job = JobPost::query()->first();

    expect($job)->not->toBeNull()
        ->and($job->career_portal_url)->toBe('https://careers.example.com/jobs/frontend')
        ->and($job->apply_by_link)->toBeFalse();

    $this->actingAs($employer)
        ->put(route('employer.jobs.update', $job), applyByLinkEmployerPayload([
            'title' => $job->title,
            'career_portal_url' => '',
            'apply_by_link' => true,
        ]))
        ->assertRedirect(route('employer.jobs'));

    $job->refresh();

    expect($job->career_portal_url)->toBeNull()
        ->and($job->apply_by_link)->toBeFalse();
});

test('employers cannot enable apply by link', function () {
    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Apply By Link Role',
        'category' => 'others',
        'location' => 'khartoum',
        'employment_type' => 'full_time',
        'experience_level' => 'Mid Level',
        'status' => JobPostStatus::Draft,
        'career_portal_url' => 'https://careers.example.com/jobs/old',
        'apply_by_link' => false,
    ]);

    $this->actingAs($employer)
        ->put(route('employer.jobs.update', $job), applyByLinkEmployerPayload([
            'title' => $job->title,
            'career_portal_url' => 'https://careers.example.com/jobs/old',
            'apply_by_link' => true,
        ]))
        ->assertRedirect(route('employer.jobs'));

    expect($job->fresh()->apply_by_link)->toBeFalse();
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

test('admins can enable and disable apply by link from the job show toggle', function () {
    $admin = User::factory()->admin()->create();
    $job = JobPost::factory()->create([
        'title' => 'Toggle Portal Role',
        'status' => JobPostStatus::Active,
        'career_portal_url' => 'https://careers.example.com/jobs/toggle',
        'apply_by_link' => false,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.jobs.apply-by-link', $job), [
            'apply_by_link' => true,
        ])
        ->assertRedirect();

    expect($job->fresh()->apply_by_link)->toBeTrue();

    $this->actingAs($admin)
        ->post(route('admin.jobs.apply-by-link', $job), [
            'apply_by_link' => false,
        ])
        ->assertRedirect();

    expect($job->fresh()->apply_by_link)->toBeFalse();
});

test('admins can enable and disable apply by link on pending and active jobs via edit', function () {
    $admin = User::factory()->admin()->create();
    $pending = JobPost::factory()->create([
        'title' => 'Pending Portal Role',
        'category' => 'others',
        'location' => 'khartoum',
        'country' => 'sudan',
        'employment_type' => 'full_time',
        'experience_level' => 'Mid Level',
        'status' => JobPostStatus::Pending,
        'career_portal_url' => 'https://careers.example.com/jobs/pending',
        'apply_by_link' => false,
    ]);

    $this->actingAs($admin)
        ->put(route('admin.jobs.update', $pending), applyByLinkAdminPayload($pending, [
            'apply_by_link' => true,
        ]))
        ->assertRedirect(route('admin.jobs.show', $pending));

    expect($pending->fresh()->apply_by_link)->toBeTrue();

    $active = JobPost::factory()->create([
        'title' => 'Active Portal Role',
        'category' => 'others',
        'location' => 'khartoum',
        'country' => 'sudan',
        'employment_type' => 'full_time',
        'experience_level' => 'Mid Level',
        'status' => JobPostStatus::Active,
        'career_portal_url' => 'https://careers.example.com/jobs/active',
        'apply_by_link' => false,
    ]);

    $this->actingAs($admin)
        ->put(route('admin.jobs.update', $active), applyByLinkAdminPayload($active, [
            'apply_by_link' => true,
            'status' => JobPostStatus::Active->value,
        ]))
        ->assertRedirect(route('admin.jobs.show', $active));

    expect($active->fresh()->apply_by_link)->toBeTrue();
});

test('admin job show includes apply by link props', function () {
    $admin = User::factory()->admin()->create();
    $job = JobPost::factory()->create([
        'career_portal_url' => 'https://careers.example.com/jobs/show',
        'apply_by_link' => true,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.jobs.show', $job))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/Admin/JobShow')
            ->where('job.career_portal_url', 'https://careers.example.com/jobs/show')
            ->where('job.apply_by_link', true));
});

test('public job show keeps on-site apply when url is set but apply by link is disabled', function () {
    $job = JobPost::factory()->create([
        'slug' => 'url-without-apply-by-link',
        'status' => JobPostStatus::Active,
        'career_portal_url' => 'https://careers.example.com/jobs/public',
        'apply_by_link' => false,
    ]);

    $this->get(route('jobs.show', $job->slug))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('frontend/job-show')
            ->where('job.career_portal_url', 'https://careers.example.com/jobs/public')
            ->where('job.apply_by_link', false));
});

test('public job show exposes apply by link when enabled with url', function () {
    $job = JobPost::factory()->create([
        'slug' => 'apply-by-link-public-role',
        'status' => JobPostStatus::Active,
        'career_portal_url' => 'https://careers.example.com/jobs/public',
        'apply_by_link' => true,
    ]);

    $this->get(route('jobs.show', $job->slug))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('frontend/job-show')
            ->where('job.career_portal_url', 'https://careers.example.com/jobs/public')
            ->where('job.apply_by_link', true)
            ->where('translations', fn ($translations) => ($translations['job_detail.apply_by_link'] ?? null) === 'Apply by Link'
                && ($translations['admin.jobs.fields.apply_by_link'] ?? null) === 'Enable Apply by Link'));
});

test('public job show omits empty apply by link url', function () {
    $job = JobPost::factory()->create([
        'slug' => 'no-apply-by-link-role',
        'status' => JobPostStatus::Active,
        'career_portal_url' => null,
        'apply_by_link' => true,
    ]);

    $this->get(route('jobs.show', $job->slug))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('frontend/job-show')
            ->where('job.career_portal_url', null)
            ->where('job.apply_by_link', true));
});
