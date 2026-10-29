<?php

use App\Enums\JobApplicationStatus;
use App\Enums\JobPostStatus;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\User;

test('employer reports lists own jobs with application summaries', function () {
    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Reported Role',
        'status' => JobPostStatus::Active,
    ]);

    JobApplication::factory()->create([
        'job_post_id' => $job->id,
        'status' => JobApplicationStatus::Shortlisted,
    ]);
    JobApplication::factory()->create([
        'job_post_id' => $job->id,
        'status' => JobApplicationStatus::Interview,
    ]);

    $foreign = User::factory()->employer()->create();
    JobPost::factory()->create([
        'employer_id' => $foreign->id,
        'title' => 'Foreign Role',
        'status' => JobPostStatus::Active,
    ]);

    $this->actingAs($employer)
        ->get(route('employer.reports'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/User/EmployerReports')
            ->has('jobs.data', 1)
            ->where('jobs.data.0.title', 'Reported Role')
            ->where('jobs.data.0.total', 2)
            ->where('jobs.data.0.shortlisted', 1)
            ->where('jobs.data.0.interview', 1)
            ->where('jobs.data.0.reference', 'JOB-'.str_pad((string) $job->id, 5, '0', STR_PAD_LEFT)));
});

test('guests cannot open employer reports', function () {
    $this->get(route('employer.reports'))->assertRedirect(route('login'));
});

test('job seekers cannot open employer reports', function () {
    $seeker = User::factory()->jobSeeker()->create();

    $this->actingAs($seeker)
        ->get(route('employer.reports'))
        ->assertForbidden();
});

test('employer reports paginates jobs at the default page size', function () {
    $employer = User::factory()->employer()->create();
    JobPost::factory()->count(31)->create([
        'employer_id' => $employer->id,
        'status' => JobPostStatus::Active,
    ]);

    $this->actingAs($employer)
        ->get(route('employer.reports'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('jobs.data', 30)
            ->where('jobs.total', 31)
            ->where('jobs.per_page', 30));

    $this->actingAs($employer)
        ->get(route('employer.reports', ['page' => 2]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('jobs.data', 1));
});
