<?php

use App\Enums\JobPostStatus;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\User;
use Database\Seeders\JobTaxonomySeeder;

beforeEach(function () {
    $this->seed(JobTaxonomySeeder::class);
});

test('job applications accept an optional position-specific cover letter', function () {
    $seeker = User::factory()->jobSeeker()->create();
    $job = JobPost::factory()->create(['status' => JobPostStatus::Active]);

    $this->actingAs($seeker)
        ->post(route('jobs.apply', $job))
        ->assertRedirect(route('job-seeker.dashboard'));

    expect(JobApplication::query()->where('job_seeker_id', $seeker->id)->first())
        ->cover_letter->toBeNull();

    $secondJob = JobPost::factory()->create(['status' => JobPostStatus::Active]);

    $this->actingAs($seeker)
        ->post(route('jobs.apply', $secondJob), [
            'cover_letter' => 'I am excited to apply for this Housekeeper role and bring my experience.',
        ])
        ->assertRedirect(route('job-seeker.dashboard'));

    expect(JobApplication::query()->where('job_post_id', $secondJob->id)->first())
        ->cover_letter->toContain('Housekeeper');
});

test('job seeker profile no longer exposes a permanent cover letter upload', function () {
    $seeker = User::factory()->jobSeeker()->create([
        'cover_letter_path' => 'cover-letters/old.pdf',
        'cover_letter_original_name' => 'old.pdf',
    ]);

    $this->actingAs($seeker)
        ->get(route('job-seeker.profile'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/User/JobSeekerProfile')
            ->missing('profile.cover_letter_url')
            ->where('profile.resume_url', null));
});

test('jobs listing page still renders job cards for guests', function () {
    JobPost::factory()->create([
        'status' => JobPostStatus::Active,
        'title' => 'Housekeeper',
    ]);

    $this->get(route('jobs'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('frontend/jobs')
            ->has('jobs.data', 1)
            ->where('jobs.data.0.title', 'Housekeeper'));
});
