<?php

use App\Enums\JobPostStatus;
use App\Models\JobPost;
use App\Models\User;

test('job detail page can be rendered', function () {
    $employer = User::factory()->employer()->create([
        'company_name' => 'TechCorp Solutions',
        'industry' => 'Technology',
        'about' => '<p>We build products.</p>',
        'website' => 'https://techcorp.example',
    ]);
    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Senior Frontend Developer',
        'subtitle' => 'Shape the product experience',
        'slug' => 'senior-frontend-developer',
        'status' => JobPostStatus::Active,
        'category' => 'Engineering',
        'experience_level' => 'Senior',
        'employment_type' => 'Full-time',
        'location' => 'Riyadh',
        'salary_range' => '15,000 - 20,000 SAR',
        'requirements' => "5+ years React\nStrong TypeScript",
        'skills' => ['React', 'TypeScript'],
        'expires_at' => now()->addDays(30),
        'description' => '<p><strong>Build</strong> great UIs.</p>',
    ]);

    $this->get(route('jobs.show', $job->slug))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('frontend/job-show')
            ->where('job.slug', 'senior-frontend-developer')
            ->where('job.title', 'Senior Frontend Developer')
            ->where('job.subtitle', 'Shape the product experience')
            ->where('job.company', 'TechCorp Solutions')
            ->where('job.category', 'Engineering')
            ->where('job.experience', 'Senior')
            ->where('job.type', 'Full-time')
            ->where('job.location', 'Riyadh')
            ->where('job.salary', '15,000 - 20,000 SAR')
            ->where('job.deadline', $job->expires_at?->toDateString())
            ->where('job.requirements', ['5+ years React', 'Strong TypeScript'])
            ->where('job.skills', ['React', 'TypeScript'])
            ->where('job.company_industry', 'Technology')
            ->where('job.company_about', '<p>We build products.</p>')
            ->where('job.company_website', 'https://techcorp.example')
            ->has('job.posted')
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
        ->assertInertia(fn($page) => $page
            ->has('translations')
            ->where('translations', fn($translations) => ($translations['job_detail.apply_now'] ?? null) === 'Apply Now'
                && ($translations['job_detail.share_via'] ?? null) === 'Share via:'
                && ($translations['job_detail.apply_confirm'] ?? null) === 'Confirm Apply'
                && ($translations['job_detail.modify_profile'] ?? null) === 'Modify Profile'));
});
