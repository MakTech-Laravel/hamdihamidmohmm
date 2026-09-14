<?php

use App\Enums\JobPostStatus;
use App\Models\JobPost;
use App\Models\User;

test('job detail page can be rendered', function () {
    $employer = User::factory()->employer()->create([
        'company_name' => 'TechCorp Solutions',
    ]);
    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Senior Frontend Developer',
        'subtitle' => 'Shape the product experience',
        'slug' => 'senior-frontend-developer',
        'status' => JobPostStatus::Active,
    ]);

    $this->get(route('jobs.show', $job->slug))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('frontend/job-show')
            ->where('job.slug', 'senior-frontend-developer')
            ->where('job.title', 'Senior Frontend Developer')
            ->where('job.subtitle', 'Shape the product experience')
            ->where('job.company', 'TechCorp Solutions')
            ->has('job.company_logo_url'));
});

test('job detail page returns not found for unknown slug', function () {
    $this->get(route('jobs.show', 'unknown-role'))
        ->assertNotFound();
});

test('job detail page shares job detail translations', function () {
    $job = JobPost::factory()->create([
        'slug' => 'senior-frontend-developer',
        'status' => JobPostStatus::Active,
    ]);

    $this->get(route('jobs.show', $job->slug))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('translations')
            ->where('translations', fn ($translations) => ($translations['job_detail.apply_now'] ?? null) === 'Apply Now'
                && ($translations['job_detail.share_via'] ?? null) === 'Share via:'));
});
