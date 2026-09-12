<?php

use App\Enums\JobPostStatus;
use App\Models\JobPost;
use App\Models\User;

test('admins can view full job details before approving', function () {
    $admin = User::factory()->admin()->create();
    $employer = User::factory()->employer()->create([
        'email' => 'employer@example.com',
        'company_name' => 'Horizon Labs',
    ]);

    $job = JobPost::factory()->pending()->create([
        'employer_id' => $employer->id,
        'title' => 'Senior Laravel Engineer',
        'description' => 'Build reliable hiring workflows.',
        'requirements' => '5+ years PHP experience.',
        'skills' => ['Laravel', 'PHP', 'MySQL'],
        'experience_level' => 'Senior',
        'employment_type' => 'Full Time',
        'salary_range' => '15,000 - 20,000 SAR',
        'expires_at' => now()->addDays(21),
    ]);

    $this->actingAs($admin)
        ->get(route('admin.jobs.show', $job))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/Admin/JobShow')
            ->where('job.title', 'Senior Laravel Engineer')
            ->where('job.employer', 'Horizon Labs')
            ->where('job.employer_email', 'employer@example.com')
            ->where('job.description', 'Build reliable hiring workflows.')
            ->where('job.requirements', '5+ years PHP experience.')
            ->where('job.skills', ['Laravel', 'PHP', 'MySQL'])
            ->where('job.experience_level', 'Senior')
            ->where('job.employment_type', 'Full Time')
            ->where('job.salary_range', '15,000 - 20,000 SAR')
            ->where('job.created', $job->created_at?->toDateString())
            ->where('job.expires_at', $job->expires_at?->toDateString())
            ->where('job.can_review', true)
            ->where('job.status', JobPostStatus::Pending->label()));
});

test('admins can approve a pending job from the detail page', function () {
    $admin = User::factory()->admin()->create();
    $job = JobPost::factory()->pending()->create([
        'title' => 'Product Designer',
    ]);

    $this->actingAs($admin)
        ->from(route('admin.jobs.show', $job))
        ->post(route('admin.jobs.approve', $job))
        ->assertRedirect();

    expect($job->fresh()?->status)->toBe(JobPostStatus::Active);
});
