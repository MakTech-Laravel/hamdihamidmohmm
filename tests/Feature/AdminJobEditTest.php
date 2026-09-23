<?php

use App\Enums\JobPostStatus;
use App\Models\JobPost;
use App\Models\User;
use Database\Seeders\JobTaxonomySeeder;

beforeEach(function () {
    $this->seed(JobTaxonomySeeder::class);
});

test('admins can open the job edit page', function () {
    $admin = User::factory()->admin()->create();
    $job = JobPost::factory()->create([
        'title' => 'Policy Officer',
        'category' => 'technology',
        'location' => 'khartoum',
        'country' => 'sudan',
        'employment_type' => 'full_time',
        'status' => JobPostStatus::Pending,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.jobs.edit', $job))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/Admin/JobEdit')
            ->where('job.title', 'Policy Officer'));
});

test('admins can update a job posting', function () {
    $admin = User::factory()->admin()->create();
    $job = JobPost::factory()->create([
        'title' => 'Old Title',
        'category' => 'technology',
        'location' => 'khartoum',
        'country' => 'sudan',
        'employment_type' => 'full_time',
        'experience_level' => 'Mid Level',
        'status' => JobPostStatus::Pending,
    ]);

    $this->actingAs($admin)
        ->put(route('admin.jobs.update', $job), [
            'title' => 'Corrected Title',
            'subtitle' => 'Updated subtitle',
            'category' => 'technology',
            'location' => 'khartoum',
            'country' => 'sudan',
            'employment_type' => 'full_time',
            'experience_level' => 'Senior',
            'salary_range' => 'SDG 10,000 - 15,000',
            'description' => 'Updated description for policy compliance.',
            'requirements' => 'Updated requirements.',
            'skills' => 'Laravel, React',
            'expires_at' => now()->addDays(20)->toDateString(),
            'status' => JobPostStatus::Active->value,
        ])
        ->assertRedirect(route('admin.jobs.show', $job));

    $job->refresh();

    expect($job->title)->toBe('Corrected Title')
        ->and($job->experience_level)->toBe('Senior')
        ->and($job->status)->toBe(JobPostStatus::Active)
        ->and($job->skills)->toContain('Laravel');
});
