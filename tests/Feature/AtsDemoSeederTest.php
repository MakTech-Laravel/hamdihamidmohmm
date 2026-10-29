<?php

use App\Enums\AtsScoreSource;
use App\Enums\AtsScreeningStatus;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\User;
use Database\Seeders\AtsDemoSeeder;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');
});

test('the ATS demo seeder creates a job seeker with a default CV and a matching job', function () {
    $this->seed(AtsDemoSeeder::class);

    $seeker = User::query()->where('email', AtsDemoSeeder::SEEKER_EMAIL)->firstOrFail();
    $job = JobPost::query()->where('slug', AtsDemoSeeder::JOB_SLUG)->firstOrFail();
    $cv = $seeker->jobSeekerCvs()->sole();

    expect($seeker->isJobSeeker())->toBeTrue()
        ->and($cv->is_default)->toBeTrue()
        ->and($cv->fileExists())->toBeTrue()
        ->and($seeker->resume_path)->toBe($cv->file_path)
        ->and($job->employer->email)->toBe('employer@dev.com');
});

test('the ATS demo seeder can run twice without duplicating records', function () {
    $this->seed(AtsDemoSeeder::class);
    $this->seed(AtsDemoSeeder::class);

    $seeker = User::query()->where('email', AtsDemoSeeder::SEEKER_EMAIL)->sole();
    $job = JobPost::query()->where('slug', AtsDemoSeeder::JOB_SLUG)->sole();

    expect($seeker->jobSeekerCvs()->count())->toBe(1)
        ->and(JobPost::query()->where('slug', AtsDemoSeeder::JOB_SLUG)->count())->toBe(1)
        ->and(JobApplication::query()->where('job_post_id', $job->id)->where('job_seeker_id', $seeker->id)->count())->toBe(1);
});

test('the ATS demo seeder creates a scored application for the matching job and CV', function () {
    $this->seed(AtsDemoSeeder::class);

    $seeker = User::query()->where('email', AtsDemoSeeder::SEEKER_EMAIL)->firstOrFail();
    $job = JobPost::query()->where('slug', AtsDemoSeeder::JOB_SLUG)->firstOrFail();
    $cv = $seeker->jobSeekerCvs()->sole();

    $application = JobApplication::query()
        ->where('job_post_id', $job->id)
        ->where('job_seeker_id', $seeker->id)
        ->sole();

    expect($application->resume_path)->toBe($cv->file_path)
        ->and($application->resume_original_name)->toBe($cv->original_name)
        ->and($application->ai_status)->toBe(AtsScreeningStatus::Completed)
        ->and($application->ai_source)->toBe(AtsScoreSource::Rules)
        ->and($application->ai_score)->toBeGreaterThanOrEqual(30)
        ->and($application->ai_score)->toBeGreaterThanOrEqual(75)
        ->and($application->ai_breakdown['matched_skills'])->toContain('Laravel', 'React', 'Docker');
});
