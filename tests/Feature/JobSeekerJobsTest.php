<?php

use App\Enums\JobApplicationStatus;
use App\Enums\JobPostStatus;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

test('job seekers see job logos on the portal jobs page', function () {
    Storage::fake('public');

    $seeker = User::factory()->jobSeeker()->create();
    $employer = User::factory()->employer()->create([
        'company_name' => 'Logo Co',
    ]);
    $logoPath = 'job-logos/'.$employer->id.'/seeker-list.png';
    Storage::disk('public')->put($logoPath, 'logo');

    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Logo Visible Role',
        'status' => JobPostStatus::Active,
        'logo_path' => $logoPath,
    ]);

    $this->actingAs($seeker)
        ->get(route('job-seeker.jobs'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/User/JobSeekerJobs')
            ->where('jobs.data.0.id', $job->id)
            ->where('jobs.data.0.logo_url', '/storage/'.$logoPath));
});

test('job seekers can browse open jobs in the portal with apply state', function () {
    $seeker = User::factory()->jobSeeker()->create();

    $openJob = JobPost::factory()->create([
        'title' => 'Senior Laravel Developer',
        'status' => JobPostStatus::Active,
        'location' => 'Dubai, UAE',
        'employment_type' => 'Full-time',
        'category' => 'Technology',
        'salary_range' => 'SDG 18,000 - 25,000',
    ]);

    $appliedJob = JobPost::factory()->create([
        'title' => 'Already Applied Role',
        'status' => JobPostStatus::Active,
    ]);

    JobApplication::factory()->create([
        'job_post_id' => $appliedJob->id,
        'job_seeker_id' => $seeker->id,
        'status' => JobApplicationStatus::Applied,
    ]);

    $this->actingAs($seeker)
        ->get(route('job-seeker.jobs'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/User/JobSeekerJobs')
            ->has('jobs.data', 2)
            ->where('jobs.data', fn ($rows) => collect($rows)->contains(
                fn ($row) => $row['title'] === 'Senior Laravel Developer' && $row['applied'] === false,
            ) && collect($rows)->contains(
                fn ($row) => $row['title'] === 'Already Applied Role' && $row['applied'] === true,
            )));
});

test('job seekers can open a job to review before applying from the portal jobs page', function () {
    $seeker = User::factory()->jobSeeker()->create();

    $job = JobPost::factory()->create([
        'title' => 'Portal Apply Role',
        'status' => JobPostStatus::Active,
        'slug' => 'portal-apply-role',
    ]);

    $this->actingAs($seeker)
        ->get(route('job-seeker.jobs'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/User/JobSeekerJobs')
            ->where('jobs.data.0.job_url', route('jobs.show', $job->slug))
            ->where('jobs.data.0.applied', false));

    $this->actingAs($seeker)
        ->get(route('jobs.show', $job->slug))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('frontend/job-show')
            ->where('can_apply', true)
            ->where('applied', false));

    $this->actingAs($seeker)
        ->from(route('jobs.show', $job->slug))
        ->post(route('jobs.apply', $job))
        ->assertRedirect(route('job-seeker.dashboard'))
        ->assertSessionHas('success', 'application_submitted');

    expect(JobApplication::query()
        ->where('job_seeker_id', $seeker->id)
        ->where('job_post_id', $job->id)
        ->exists())->toBeTrue();
});

test('job seekers can search jobs in the portal', function () {
    $seeker = User::factory()->jobSeeker()->create();

    JobPost::factory()->create([
        'title' => 'React Engineer',
        'status' => JobPostStatus::Active,
    ]);

    JobPost::factory()->create([
        'title' => 'Finance Analyst',
        'status' => JobPostStatus::Active,
    ]);

    $this->actingAs($seeker)
        ->get(route('job-seeker.jobs', ['search' => 'React']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('jobs.data', 1)
            ->where('jobs.data.0.title', 'React Engineer')
            ->where('filters.search', 'React'));
});
