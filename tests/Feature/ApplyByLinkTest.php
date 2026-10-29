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
        'hide_on_site_apply' => (bool) $job->hide_on_site_apply,
        'employer_can_manage_apply' => (bool) $job->employer_can_manage_apply,
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
        ->and($job->apply_by_link)->toBeTrue()
        ->and($job->employer_can_manage_apply)->toBeTrue();

    $this->actingAs($employer)
        ->put(route('employer.jobs.update', $job), applyByLinkEmployerPayload([
            'title' => $job->title,
            'career_portal_url' => '',
            'apply_by_link' => false,
        ]))
        ->assertRedirect(route('employer.jobs'));

    $job->refresh();

    expect($job->career_portal_url)->toBeNull()
        ->and($job->apply_by_link)->toBeFalse();
});

test('employers can save an apply by link email and enable hide apply now', function () {
    $employer = User::factory()->employer()->create();

    $this->actingAs($employer)
        ->post(route('employer.jobs.store'), applyByLinkEmployerPayload([
            'career_portal_url' => 'jobs@example.com',
            'apply_by_link' => true,
            'hide_on_site_apply' => true,
        ]))
        ->assertRedirect(route('employer.jobs'));

    $job = JobPost::query()->first();

    expect($job)->not->toBeNull()
        ->and($job->career_portal_url)->toBe('jobs@example.com')
        ->and($job->apply_by_link)->toBeTrue()
        ->and($job->hide_on_site_apply)->toBeTrue();
});

test('employers cannot save an invalid apply by link destination', function () {
    $employer = User::factory()->employer()->create();

    $this->actingAs($employer)
        ->post(route('employer.jobs.store'), applyByLinkEmployerPayload([
            'career_portal_url' => 'not-a-url-or-email',
        ]))
        ->assertSessionHasErrors('career_portal_url');
});

test('employers cannot set employer_can_manage_apply', function () {
    $employer = User::factory()->employer()->create();

    $this->actingAs($employer)
        ->post(route('employer.jobs.store'), applyByLinkEmployerPayload([
            'employer_can_manage_apply' => false,
            'apply_by_link' => true,
            'career_portal_url' => 'https://careers.example.com/jobs/locked-create',
        ]))
        ->assertRedirect(route('employer.jobs'));

    $job = JobPost::query()->first();

    expect($job)->not->toBeNull()
        ->and($job->employer_can_manage_apply)->toBeTrue();
});

test('locked employers cannot change apply settings', function () {
    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Locked Apply Role',
        'category' => 'others',
        'location' => 'khartoum',
        'employment_type' => 'full_time',
        'experience_level' => 'Mid Level',
        'status' => JobPostStatus::Draft,
        'career_portal_url' => 'https://careers.example.com/jobs/old',
        'apply_by_link' => true,
        'hide_on_site_apply' => false,
        'employer_can_manage_apply' => false,
    ]);

    $this->actingAs($employer)
        ->put(route('employer.jobs.update', $job), applyByLinkEmployerPayload([
            'title' => $job->title,
            'career_portal_url' => 'changed@example.com',
            'apply_by_link' => false,
            'hide_on_site_apply' => true,
            'employer_can_manage_apply' => true,
        ]))
        ->assertRedirect(route('employer.jobs'));

    $job->refresh();

    expect($job->career_portal_url)->toBe('https://careers.example.com/jobs/old')
        ->and($job->apply_by_link)->toBeTrue()
        ->and($job->hide_on_site_apply)->toBeFalse()
        ->and($job->employer_can_manage_apply)->toBeFalse();
});

test('employer job editor receives apply settings props', function () {
    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'career_portal_url' => 'https://careers.example.com/jobs/edit',
        'apply_by_link' => true,
        'hide_on_site_apply' => true,
        'employer_can_manage_apply' => false,
    ]);

    $this->actingAs($employer)
        ->get(route('employer.jobs.edit', $job))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/User/EmployerJobEditor')
            ->where('job.career_portal_url', 'https://careers.example.com/jobs/edit')
            ->where('job.apply_by_link', true)
            ->where('job.hide_on_site_apply', true)
            ->where('job.employer_can_manage_apply', false));
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

test('admins can toggle hide on site apply and employer manage apply', function () {
    $admin = User::factory()->admin()->create();
    $job = JobPost::factory()->create([
        'status' => JobPostStatus::Active,
        'career_portal_url' => 'https://careers.example.com/jobs/toggle-extra',
        'hide_on_site_apply' => false,
        'employer_can_manage_apply' => true,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.jobs.hide-on-site-apply', $job), [
            'hide_on_site_apply' => true,
        ])
        ->assertRedirect();

    expect($job->fresh()->hide_on_site_apply)->toBeTrue();

    $this->actingAs($admin)
        ->post(route('admin.jobs.employer-manage-apply', $job), [
            'employer_can_manage_apply' => false,
        ])
        ->assertRedirect();

    expect($job->fresh()->employer_can_manage_apply)->toBeFalse();
});

test('admins can override apply settings on pending and active jobs via edit', function () {
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
        'hide_on_site_apply' => false,
        'employer_can_manage_apply' => true,
    ]);

    $this->actingAs($admin)
        ->put(route('admin.jobs.update', $pending), applyByLinkAdminPayload($pending, [
            'career_portal_url' => 'hr@example.com',
            'apply_by_link' => true,
            'hide_on_site_apply' => true,
            'employer_can_manage_apply' => false,
        ]))
        ->assertRedirect(route('admin.jobs.show', $pending));

    $pending->refresh();

    expect($pending->career_portal_url)->toBe('hr@example.com')
        ->and($pending->apply_by_link)->toBeTrue()
        ->and($pending->hide_on_site_apply)->toBeTrue()
        ->and($pending->employer_can_manage_apply)->toBeFalse();

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
        'employer_can_manage_apply' => true,
    ]);

    $this->actingAs($admin)
        ->put(route('admin.jobs.update', $active), applyByLinkAdminPayload($active, [
            'apply_by_link' => true,
            'employer_can_manage_apply' => false,
            'status' => JobPostStatus::Active->value,
        ]))
        ->assertRedirect(route('admin.jobs.show', $active));

    expect($active->fresh()->apply_by_link)->toBeTrue()
        ->and($active->fresh()->employer_can_manage_apply)->toBeFalse();
});

test('admin job show includes apply settings props', function () {
    $admin = User::factory()->admin()->create();
    $job = JobPost::factory()->create([
        'career_portal_url' => 'https://careers.example.com/jobs/show',
        'apply_by_link' => true,
        'hide_on_site_apply' => true,
        'employer_can_manage_apply' => false,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.jobs.show', $job))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/Admin/JobShow')
            ->where('job.career_portal_url', 'https://careers.example.com/jobs/show')
            ->where('job.apply_by_link', true)
            ->where('job.hide_on_site_apply', true)
            ->where('job.employer_can_manage_apply', false));
});

test('public job show keeps on-site apply when url is set but apply by link is disabled', function () {
    $job = JobPost::factory()->create([
        'slug' => 'url-without-apply-by-link',
        'status' => JobPostStatus::Active,
        'career_portal_url' => 'https://careers.example.com/jobs/public',
        'apply_by_link' => false,
        'hide_on_site_apply' => true,
    ]);

    $this->get(route('jobs.show', $job->slug))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('frontend/job-show')
            ->where('job.career_portal_url', 'https://careers.example.com/jobs/public')
            ->where('job.apply_by_link', false)
            ->where('job.hide_on_site_apply', true));
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

test('public job show exposes email apply by link destination', function () {
    $job = JobPost::factory()->create([
        'slug' => 'apply-by-email-public-role',
        'status' => JobPostStatus::Active,
        'career_portal_url' => 'jobs@example.com',
        'apply_by_link' => true,
        'hide_on_site_apply' => true,
    ]);

    $this->get(route('jobs.show', $job->slug))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('frontend/job-show')
            ->where('job.career_portal_url', 'jobs@example.com')
            ->where('job.apply_by_link', true)
            ->where('job.hide_on_site_apply', true)
            ->where('translations', fn ($translations) => ($translations['job_detail.apply_by_email'] ?? null) === 'Apply by Email'));
});

test('public job show omits empty apply by link url', function () {
    $job = JobPost::factory()->create([
        'slug' => 'no-apply-by-link-role',
        'status' => JobPostStatus::Active,
        'career_portal_url' => null,
        'apply_by_link' => true,
        'hide_on_site_apply' => true,
    ]);

    $this->get(route('jobs.show', $job->slug))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('frontend/job-show')
            ->where('job.career_portal_url', null)
            ->where('job.apply_by_link', true)
            ->where('job.hide_on_site_apply', true));
});
