<?php

use App\Enums\JobApplicationStatus;
use App\Enums\JobPostStatus;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\User;
use App\Notifications\ApplicationSubmittedNotification;
use Database\Seeders\JobTaxonomySeeder;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed(JobTaxonomySeeder::class);
});

test('employers can preview draft and pending jobs while guests cannot', function () {
    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Draft Officer',
        'slug' => 'draft-officer',
        'status' => JobPostStatus::Draft,
    ]);

    $this->get(route('jobs.show', $job->slug))
        ->assertNotFound();

    $this->actingAs($employer)
        ->get(route('jobs.show', $job->slug))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('frontend/job-show')
            ->where('job.title', 'Draft Officer')
            ->where('is_preview', true)
            ->where('can_apply', false));

    $job->forceFill(['status' => JobPostStatus::Pending])->save();

    $this->actingAs($employer)
        ->get(route('jobs.show', $job->slug))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->where('is_preview', true)
            ->where('job.slug', 'draft-officer'));
});

test('view applicants can be filtered to a single job', function () {
    $employer = User::factory()->employer()->create();
    $otherEmployer = User::factory()->employer()->create();
    $seeker = User::factory()->jobSeeker()->create(['name' => 'Sara Applicant']);

    $role = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'CVA Officer',
        'status' => JobPostStatus::Active,
    ]);
    $otherRole = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Finance Assistant',
        'status' => JobPostStatus::Active,
    ]);
    $foreignRole = JobPost::factory()->create([
        'employer_id' => $otherEmployer->id,
        'title' => 'External Role',
        'status' => JobPostStatus::Active,
    ]);

    JobApplication::factory()->create([
        'job_post_id' => $role->id,
        'job_seeker_id' => $seeker->id,
        'status' => JobApplicationStatus::Applied,
    ]);
    JobApplication::factory()->create([
        'job_post_id' => $otherRole->id,
        'status' => JobApplicationStatus::Applied,
    ]);
    JobApplication::factory()->create([
        'job_post_id' => $foreignRole->id,
        'status' => JobApplicationStatus::Applied,
    ]);

    $this->actingAs($employer)
        ->get(route('employer.applications', ['job_id' => $role->id]))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/User/EmployerApplications')
            ->has('applications', 1)
            ->where('applications.0.name', 'Sara Applicant')
            ->where('applications.0.job', 'CVA Officer')
            ->where('filters.job_id', $role->id)
            ->where('filters.job_title', 'CVA Officer'));
});

test('publishing a job flashes the admin-approval confirmation', function () {
    $employer = User::factory()->employer()->create();

    $this->actingAs($employer)
        ->post(route('employer.jobs.store'), [
            'title' => 'WASH Officer',
            'category' => 'technology',
            'location' => 'khartoum',
            'country' => 'sudan',
            'employment_type' => 'full_time',
            'experience_level' => 'Mid Level',
            'publish' => true,
        ])
        ->assertRedirect(route('employer.jobs'))
        ->assertSessionHas('success', 'job_submitted');

    $job = JobPost::query()->where('title', 'WASH Officer')->first();

    expect($job)->not->toBeNull()
        ->and($job->status)->toBe(JobPostStatus::Pending);

    $this->actingAs($employer)
        ->post(route('employer.jobs.publish', $job))
        ->assertRedirect()
        ->assertSessionHas('success', 'job_submitted');
});

test('job seekers receive a confirmation email after applying', function () {
    Notification::fake();

    $employer = User::factory()->employer()->create([
        'company_name' => 'Gulf Relief',
    ]);
    $seeker = User::factory()->jobSeeker()->create(['name' => 'Ali Seeker']);
    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Education Officer',
        'status' => JobPostStatus::Active,
    ]);

    $this->actingAs($seeker)
        ->post(route('jobs.apply', $job), [
            'cover_letter' => 'I would like to join.',
        ])
        ->assertRedirect(route('job-seeker.dashboard'))
        ->assertSessionHas('success', 'application_submitted');

    Notification::assertSentTo(
        $seeker,
        ApplicationSubmittedNotification::class,
        function (ApplicationSubmittedNotification $notification) use ($seeker): bool {
            expect($notification->jobTitle)->toBe('Education Officer')
                ->and($notification->companyName)->toBe('Gulf Relief')
                ->and($notification->via($seeker))->toContain('mail')
                ->and($notification->toMail($seeker)->subject)
                ->toBe('Your application for Education Officer was submitted');

            return true;
        },
    );
});

test('job detail falls back to the company logo when the job has no logo', function () {
    Storage::fake('public');

    $employer = User::factory()->employer()->create([
        'company_name' => 'Action Against Hunger',
    ]);
    $companyLogoPath = 'company-logos/' . $employer->id . '/brand.png';
    Storage::disk('public')->put($companyLogoPath, 'logo');
    $employer->forceFill(['company_logo_path' => $companyLogoPath])->save();

    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'slug' => 'field-coordinator',
        'status' => JobPostStatus::Active,
        'logo_path' => null,
    ]);

    $this->get(route('jobs.show', $job->slug))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('frontend/job-show')
            ->where('job.logo_url', '/storage/' . $companyLogoPath)
            ->where('job.company_logo_url', '/storage/' . $companyLogoPath)
            ->where('is_preview', false));
});
