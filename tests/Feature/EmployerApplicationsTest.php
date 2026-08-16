<?php

use App\Enums\JobApplicationStatus;
use App\Enums\JobPostStatus;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\JobSeekerProfile;
use App\Models\User;

test('employers see live application table props matching the Figma page', function () {
    $employer = User::factory()->employer()->create();
    $seeker = User::factory()->jobSeeker()->create([
        'name' => 'Ahmed Al-Rashidi',
        'location' => 'Riyadh',
    ]);

    JobSeekerProfile::factory()->create([
        'user_id' => $seeker->id,
        'headline' => 'Frontend Engineer',
        'experience' => [
            ['company' => 'TechCorp', 'title' => 'Developer', 'years' => 6],
        ],
    ]);

    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Senior Frontend Developer',
        'status' => JobPostStatus::Active,
    ]);

    JobApplication::factory()->create([
        'job_post_id' => $job->id,
        'job_seeker_id' => $seeker->id,
        'status' => JobApplicationStatus::Interview,
        'cover_letter' => 'I would like to join the frontend team.',
        'created_at' => now()->setDate(2026, 8, 3),
    ]);

    $this->actingAs($employer)
        ->get(route('employer.applications'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/User/EmployerApplications')
            ->where('stats.total', 1)
            ->where('stats.interview', 1)
            ->where('stats.shortlisted', 0)
            ->where('applications.0.name', 'Ahmed Al-Rashidi')
            ->where('applications.0.job', 'Senior Frontend Developer')
            ->where('applications.0.experience', '6 years')
            ->where('applications.0.location', 'Riyadh')
            ->where('applications.0.status', 'Interview')
            ->where('applications.0.date', 'Aug 3, 2026')
            ->where('applications.0.next_status', JobApplicationStatus::Offer->value)
            ->where('applications.0.can_move', true)
            ->where('applications.0.can_reject', true));
});

test('employers can move an application to the next hiring stage', function () {
    $employer = User::factory()->employer()->create();
    $seeker = User::factory()->jobSeeker()->create();
    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'status' => JobPostStatus::Active,
    ]);
    $application = JobApplication::factory()->create([
        'job_post_id' => $job->id,
        'job_seeker_id' => $seeker->id,
        'status' => JobApplicationStatus::Applied,
    ]);

    $this->actingAs($employer)
        ->put(route('employer.applications.update', $application), [
            'status' => JobApplicationStatus::UnderReview->value,
        ])
        ->assertRedirect();

    expect($application->fresh()->status)->toBe(JobApplicationStatus::UnderReview);
});

test('employers can reject an application', function () {
    $employer = User::factory()->employer()->create();
    $seeker = User::factory()->jobSeeker()->create();
    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'status' => JobPostStatus::Active,
    ]);
    $application = JobApplication::factory()->create([
        'job_post_id' => $job->id,
        'job_seeker_id' => $seeker->id,
        'status' => JobApplicationStatus::Shortlisted,
    ]);

    $this->actingAs($employer)
        ->put(route('employer.applications.update', $application), [
            'status' => JobApplicationStatus::Rejected->value,
        ])
        ->assertRedirect();

    expect($application->fresh()->status)->toBe(JobApplicationStatus::Rejected);
});

test('employers cannot update another company application', function () {
    $employer = User::factory()->employer()->create();
    $other = User::factory()->employer()->create();
    $job = JobPost::factory()->create([
        'employer_id' => $other->id,
        'status' => JobPostStatus::Active,
    ]);
    $application = JobApplication::factory()->create([
        'job_post_id' => $job->id,
        'status' => JobApplicationStatus::Applied,
    ]);

    $this->actingAs($employer)
        ->put(route('employer.applications.update', $application), [
            'status' => JobApplicationStatus::Rejected->value,
        ])
        ->assertForbidden();
});
