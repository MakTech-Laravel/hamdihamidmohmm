<?php

use App\Enums\JobApplicationStatus;
use App\Enums\JobPostStatus;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\JobSeekerProfile;
use App\Models\User;
use App\Support\JobSeekerResume;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('job management includes the latest applicant preview for the drawer', function () {
    $admin = User::factory()->admin()->create();
    $seeker = User::factory()->jobSeeker()->create([
        'name' => 'Ahmed Al-Rashidi',
        'email' => 'ahmed.rashidi@email.com',
        'phone' => '+966 50 123 4567',
        'location' => 'Riyadh',
    ]);

    JobSeekerProfile::factory()->create([
        'user_id' => $seeker->id,
        'headline' => 'Senior Frontend Developer',
        'skills' => ['React', 'TypeScript', 'Tailwind CSS', 'Node.js'],
        'experience' => [['company' => 'Horizon', 'title' => 'Engineer', 'years' => 6]],
    ]);

    $job = JobPost::factory()->create([
        'title' => 'Senior Front-End Developer',
        'status' => JobPostStatus::Active,
    ]);

    JobApplication::factory()->create([
        'job_post_id' => $job->id,
        'job_seeker_id' => $seeker->id,
        'status' => JobApplicationStatus::Interview,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.jobs.index'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/Admin/JobManagement')
            ->where('jobs.data.0.preview.name', 'Ahmed Al-Rashidi')
            ->where('jobs.data.0.preview.title', 'Senior Frontend Developer')
            ->where('jobs.data.0.preview.status', 'Interview')
            ->where('jobs.data.0.preview.email', 'ahmed.rashidi@email.com')
            ->where('jobs.data.0.preview.phone', '+966 50 123 4567')
            ->where('jobs.data.0.preview.location', 'Riyadh · 6 years')
            ->where('jobs.data.0.preview.skills', ['React', 'TypeScript', 'Tailwind CSS', 'Node.js'])
            ->where('jobs.data.0.preview.resume_url', route('admin.jobs.applicant-resume', [$job, $seeker]))
            ->where('jobs.data.0.preview.timeline.3.label', 'Interview')
            ->where('jobs.data.0.preview.timeline.3.state', 'current')
            ->where('jobs.data.0.preview.timeline.4.state', 'pending'));
});

test('job management falls back to a job preview when there are no applications', function () {
    $admin = User::factory()->admin()->create();
    $job = JobPost::factory()->create([
        'title' => 'Site Engineer',
        'category' => 'Construction',
        'employment_type' => 'Full-time',
        'location' => 'Dubai, UAE',
        'status' => JobPostStatus::Active,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.jobs.index'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/Admin/JobManagement')
            ->where('jobs.data.0.id', $job->id)
            ->where('jobs.data.0.preview.name', 'Site Engineer')
            ->where('jobs.data.0.preview.location', 'Dubai, UAE')
            ->where('jobs.data.0.preview.skills', ['Construction', 'Full-time'])
            ->where('jobs.data.0.preview.resume_url', null));
});

test('admins can download a resume generated from the applicant profile', function () {
    $admin = User::factory()->admin()->create();
    $seeker = User::factory()->jobSeeker()->create([
        'name' => 'Omar Nasser',
        'email' => 'omar.nasser@demo.test',
        'phone' => '+971 55 444 7788',
        'location' => 'Sharjah, UAE',
    ]);

    JobSeekerProfile::factory()->create([
        'user_id' => $seeker->id,
        'headline' => 'Civil Site Engineer',
        'bio' => 'Site engineer focused on residential and commercial construction.',
        'skills' => ['AutoCAD', 'Site Supervision', 'HSE'],
    ]);

    $job = JobPost::factory()->create(['status' => JobPostStatus::Active]);

    JobApplication::factory()->create([
        'job_post_id' => $job->id,
        'job_seeker_id' => $seeker->id,
        'status' => JobApplicationStatus::Interview,
    ]);

    $response = $this->actingAs($admin)
        ->get(route('admin.jobs.applicant-resume', [$job, $seeker]));

    $response->assertOk()->assertDownload('omar-nasser-resume.pdf');

    expect($response->streamedContent())
        ->toStartWith('%PDF-1.4')
        ->toContain('Omar Nasser')
        ->toContain('Civil Site Engineer')
        ->toContain('omar.nasser@demo.test')
        ->toContain('AutoCAD')
        ->toContain('HSE');
});

test('admins download the resume file stored on the application', function () {
    Storage::fake('local');

    $admin = User::factory()->admin()->create();
    $seeker = User::factory()->jobSeeker()->create(['name' => 'Omar Nasser']);
    $job = JobPost::factory()->create(['status' => JobPostStatus::Active]);

    Storage::disk('local')->put('resumes/omar-cv.pdf', '%PDF-1.4 stored-application-resume');

    JobApplication::factory()->create([
        'job_post_id' => $job->id,
        'job_seeker_id' => $seeker->id,
        'status' => JobApplicationStatus::Interview,
        'resume_path' => 'resumes/omar-cv.pdf',
        'resume_original_name' => 'Omar_Nasser_CV.pdf',
    ]);

    $response = $this->actingAs($admin)
        ->get(route('admin.jobs.applicant-resume', [$job, $seeker]));

    $response->assertOk()->assertDownload('Omar_Nasser_CV.pdf');

    expect($response->streamedContent())->toContain('stored-application-resume');
});

test('a seeker can attach a resume when applying', function () {
    Storage::fake('local');

    $seeker = User::factory()->jobSeeker()->create(['name' => 'Omar Nasser']);
    JobSeekerProfile::factory()->create(['user_id' => $seeker->id]);
    $job = JobPost::factory()->create(['status' => JobPostStatus::Active]);
    $resume = UploadedFile::fake()->createWithContent(
        'Omar_Nasser_CV.pdf',
        JobSeekerResume::pdf($seeker),
    );

    $this->actingAs($seeker)
        ->post(route('jobs.apply', $job), [
            'cover_letter' => 'I am available next week.',
            'resume' => $resume,
        ])
        ->assertRedirect();

    $application = JobApplication::query()->first();

    expect($application)->not->toBeNull()
        ->and($application?->resume_original_name)->toBe('Omar_Nasser_CV.pdf')
        ->and($application?->resume_path)->not->toBeNull()
        ->and(Storage::disk('local')->exists((string) $application?->resume_path))->toBeTrue();
});

test('admins cannot download a resume for a seeker who did not apply', function () {
    $admin = User::factory()->admin()->create();
    $job = JobPost::factory()->create();
    $seeker = User::factory()->jobSeeker()->create();

    $this->actingAs($admin)
        ->get(route('admin.jobs.applicant-resume', [$job, $seeker]))
        ->assertNotFound();
});
