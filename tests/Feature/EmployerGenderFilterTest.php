<?php

use App\Enums\Gender;
use App\Enums\JobApplicationStatus;
use App\Enums\JobPostStatus;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\JobSeekerProfile;
use App\Models\User;

test('employers can filter applicants by gender', function () {
    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'status' => JobPostStatus::Active,
    ]);

    $female = User::factory()->jobSeeker()->create(['name' => 'Sara Ali']);
    JobSeekerProfile::factory()->create([
        'user_id' => $female->id,
        'gender' => Gender::Female,
    ]);
    JobApplication::factory()->create([
        'job_post_id' => $job->id,
        'job_seeker_id' => $female->id,
        'status' => JobApplicationStatus::Applied,
    ]);

    $male = User::factory()->jobSeeker()->create(['name' => 'Omar Hassan']);
    JobSeekerProfile::factory()->create([
        'user_id' => $male->id,
        'gender' => Gender::Male,
    ]);
    JobApplication::factory()->create([
        'job_post_id' => $job->id,
        'job_seeker_id' => $male->id,
        'status' => JobApplicationStatus::Applied,
    ]);

    $this->actingAs($employer)
        ->get(route('employer.applications', ['gender' => Gender::Female->value]))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/User/EmployerApplications')
            ->where('filters.gender', Gender::Female->value)
            ->has('applications.data', 1)
            ->where('applications.data.0.name', 'Sara Ali')
            ->where('applications.data.0.gender', Gender::Female->value)
            ->where('applications.data.0.gender_label', 'Female')
            ->has('gender_options', 2));
});
