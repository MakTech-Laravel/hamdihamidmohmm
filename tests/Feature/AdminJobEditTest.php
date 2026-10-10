<?php

use App\Enums\JobPostStatus;
use App\Models\JobPost;
use App\Models\User;
use Database\Seeders\JobTaxonomySeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

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
        ->assertInertia(fn($page) => $page
            ->component('backend/Admin/JobEdit')
            ->where('job.title', 'Policy Officer')
            ->has('job.logo_url')
            ->has('job.description')
            ->has('options.statuses'));
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
            'description' => '<p><strong>Updated</strong> description for policy compliance.</p><script>alert(1)</script>',
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
        ->and($job->skills)->toContain('Laravel')
        ->and($job->description)->toContain('<strong>Updated</strong>')
        ->and($job->description)->not->toContain('<script>');
});

test('admins can upload and remove a job logo', function () {
    Storage::fake('public');

    $admin = User::factory()->admin()->create();
    $job = JobPost::factory()->create([
        'status' => JobPostStatus::Pending,
    ]);

    $logo = UploadedFile::fake()->image('admin-job-logo.png', 200, 200);

    $this->actingAs($admin)
        ->post(route('admin.jobs.logo.upload', $job), ['logo' => $logo])
        ->assertRedirect();

    $job->refresh();

    expect($job->logo_path)->not->toBeNull()
        ->and($job->hasLogo())->toBeTrue()
        ->and(Storage::disk('public')->exists((string) $job->logo_path))->toBeTrue();

    $this->actingAs($admin)
        ->delete(route('admin.jobs.logo.destroy', $job))
        ->assertRedirect();

    $job->refresh();

    expect($job->logo_path)->toBeNull()
        ->and($job->hasLogo())->toBeFalse();
});

test('admins can upload pdf attachments for job descriptions', function () {
    Storage::fake('public');

    $admin = User::factory()->admin()->create();
    $file = UploadedFile::fake()->create('P11-form.pdf', 200, 'application/pdf');

    $response = $this->actingAs($admin)
        ->postJson(route('admin.jobs.description-attachments.store'), [
            'file' => $file,
        ])
        ->assertOk()
        ->assertJsonStructure(['url', 'name'])
        ->assertJsonPath('name', 'P11-form.pdf');

    expect($response->json('url'))->toStartWith('/storage/job-description-attachments/admin/' . $admin->id . '/');
});
