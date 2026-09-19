<?php

use App\Enums\JobPostStatus;
use App\Models\JobPost;
use App\Models\User;
use Database\Seeders\JobTaxonomySeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
    $this->seed(JobTaxonomySeeder::class);
});

test('employers can upload a job logo separately from the company logo', function () {
    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'status' => JobPostStatus::Draft,
    ]);

    $logo = UploadedFile::fake()->image('job-logo.png', 200, 200);

    $this->actingAs($employer)
        ->post(route('employer.jobs.logo.upload', $job), ['logo' => $logo])
        ->assertRedirect();

    $job->refresh();

    expect($job->logo_path)->not->toBeNull()
        ->and($job->hasLogo())->toBeTrue()
        ->and(Storage::disk('public')->exists((string) $job->logo_path))->toBeTrue();
});

test('employers can attach a job logo while creating a job', function () {
    $employer = User::factory()->employer()->create();
    $logo = UploadedFile::fake()->image('create-logo.jpg', 180, 180);

    $this->actingAs($employer)
        ->post(route('employer.jobs.store'), [
            'title' => 'Frontend Engineer',
            'subtitle' => 'Build the portal',
            'employment_type' => 'full_time',
            'publish' => false,
            'logo' => $logo,
        ])
        ->assertRedirect(route('employer.jobs'));

    $job = JobPost::query()->first();

    expect($job)->not->toBeNull()
        ->and($job->title)->toBe('Frontend Engineer')
        ->and($job->hasLogo())->toBeTrue();
});

test('job detail exposes separate job and company logos', function () {
    $employer = User::factory()->employer()->create([
        'company_name' => 'Gulf Tech Solutions',
    ]);
    $companyLogoPath = 'company-logos/' . $employer->id . '/company.png';
    Storage::disk('public')->put($companyLogoPath, 'company');
    $employer->forceFill(['company_logo_path' => $companyLogoPath])->save();

    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'slug' => 'cva-officer',
        'status' => JobPostStatus::Active,
    ]);
    $jobLogoPath = 'job-logos/' . $employer->id . '/job.png';
    Storage::disk('public')->put($jobLogoPath, 'job');
    $job->forceFill(['logo_path' => $jobLogoPath])->save();

    $this->get(route('jobs.show', $job->slug))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('frontend/job-show')
            ->where('job.logo_url', '/storage/' . $jobLogoPath)
            ->where('job.company_logo_url', '/storage/' . $companyLogoPath));
});

test('employer jobs list includes job logo urls', function () {
    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Logo List Role',
        'status' => JobPostStatus::Active,
    ]);
    $logoPath = 'job-logos/' . $employer->id . '/list.png';
    Storage::disk('public')->put($logoPath, 'logo');
    $job->forceFill(['logo_path' => $logoPath])->save();

    $this->actingAs($employer)
        ->get(route('employer.jobs'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/User/EmployerJobs')
            ->where('jobs.0.logo_url', '/storage/' . $logoPath)
            ->where('jobs.0.slug', $job->slug));
});

test('employers can remove a job logo', function () {
    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'logo_path' => 'job-logos/9/old.png',
    ]);
    Storage::disk('public')->put('job-logos/9/old.png', 'old');

    $this->actingAs($employer)
        ->delete(route('employer.jobs.logo.destroy', $job))
        ->assertRedirect();

    $job->refresh();

    expect($job->logo_path)->toBeNull()
        ->and(Storage::disk('public')->exists('job-logos/9/old.png'))->toBeFalse();
});
