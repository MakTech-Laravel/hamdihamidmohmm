<?php

use App\Enums\JobApplicationStatus;
use App\Enums\JobPostStatus;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\JobSeekerProfile;
use App\Models\User;
use App\Support\ApplicantProfilePreview;
use Illuminate\Support\Facades\Storage;

test('applicant profile preview exposes the seeker profile details for employers and admins', function () {
    $seeker = User::factory()->jobSeeker()->create([
        'name' => 'Noura Saeed',
        'email' => 'noura@example.com',
        'phone' => '+966 50 999 8888',
        'location' => 'Jeddah',
    ]);

    JobSeekerProfile::factory()->create([
        'user_id' => $seeker->id,
        'headline' => 'Full Stack Developer',
        'current_title' => 'Software Engineer',
        'experience_years' => '5',
        'bio' => 'Builds reliable products.',
        'linkedin_url' => 'https://linkedin.com/in/noura',
        'github_url' => 'https://github.com/noura',
        'industry' => 'Technology',
        'expected_salary' => 'SAR 15,000 - 20,000',
        'availability' => ['Full Time', 'Remote'],
        'skills' => ['Laravel', 'React'],
        'education' => [[
            'degree' => 'BSc Software Engineering',
            'school' => 'KAU',
            'years' => '2016 - 2020',
        ]],
        'experience' => [[
            'title' => 'Backend Developer',
            'company' => 'Acme',
            'dates' => '2021 - Present',
            'years' => 4,
            'description' => 'API work',
        ]],
        'languages' => [['name' => 'Arabic', 'level' => 'Native']],
        'certifications' => [[
            'name' => 'Laravel Certified',
            'issuer' => 'Laravel',
            'date' => '2025-01',
        ]],
    ]);

    $job = JobPost::factory()->create(['status' => JobPostStatus::Active]);
    $application = JobApplication::factory()->create([
        'job_post_id' => $job->id,
        'job_seeker_id' => $seeker->id,
        'status' => JobApplicationStatus::Applied,
        'cover_letter' => 'Excited to apply.',
    ]);

    $preview = ApplicantProfilePreview::from($seeker->fresh(), $application);

    expect($preview['name'])->toBe('Noura Saeed')
        ->and($preview['title'])->toBe('Full Stack Developer')
        ->and($preview['current_title'])->toBe('Software Engineer')
        ->and($preview['experience_years'])->toBe('5 years')
        ->and($preview['industry'])->toBe('Technology')
        ->and($preview['skills'])->toBe(['Laravel', 'React'])
        ->and($preview['education'][0]['title'])->toBe('BSc Software Engineering')
        ->and($preview['experience'][0]['title'])->toBe('Backend Developer')
        ->and($preview['languages'][0]['name'])->toBe('Arabic')
        ->and($preview['certifications'][0]['name'])->toBe('Laravel Certified')
        ->and($preview['cover_letter'])->toBe('Excited to apply.')
        ->and($preview['preview_location'])->toBe('Jeddah · 5 years');
});

test('employer and admin drawers receive the full seeker profile from live applications', function () {
    $employer = User::factory()->employer()->create();
    $admin = User::factory()->admin()->create();
    $seeker = User::factory()->jobSeeker()->create([
        'name' => 'Omar Nasser',
        'location' => 'Riyadh',
    ]);

    JobSeekerProfile::factory()->create([
        'user_id' => $seeker->id,
        'headline' => 'UX Designer',
        'current_title' => 'Product Designer',
        'experience_years' => '4',
        'industry' => 'Design',
        'skills' => ['Figma', 'Research'],
        'education' => [['degree' => 'BA Design', 'school' => 'KSU', 'years' => '2018']],
        'experience' => [['title' => 'Designer', 'company' => 'Studio', 'dates' => '2022 - Present']],
        'languages' => [['name' => 'English', 'level' => 'Advanced']],
        'certifications' => [['name' => 'NN/g UX', 'issuer' => 'Nielsen', 'date' => '2024']],
    ]);

    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Senior UX Designer',
        'status' => JobPostStatus::Active,
    ]);

    JobApplication::factory()->create([
        'job_post_id' => $job->id,
        'job_seeker_id' => $seeker->id,
        'status' => JobApplicationStatus::UnderReview,
        'cover_letter' => 'Design systems are my passion.',
    ]);

    $this->actingAs($employer)
        ->get(route('employer.applications'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('applications.0.headline', 'UX Designer')
            ->where('applications.0.current_title', 'Product Designer')
            ->where('applications.0.experience_years', '4 years')
            ->where('applications.0.industry', 'Design')
            ->where('applications.0.skills', ['Figma', 'Research'])
            ->where('applications.0.education.0.title', 'BA Design')
            ->where('applications.0.experience.0.subtitle', 'Studio')
            ->where('applications.0.languages.0.name', 'English')
            ->where('applications.0.certifications.0.name', 'NN/g UX')
            ->where('applications.0.cover_letter', 'Design systems are my passion.'));

    $this->actingAs($admin)
        ->get(route('admin.jobs.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('jobs.data.0.preview.is_applicant', true)
            ->where('jobs.data.0.preview.current_title', 'Product Designer')
            ->where('jobs.data.0.preview.experience_years', '4 years')
            ->where('jobs.data.0.preview.skills', ['Figma', 'Research'])
            ->where('jobs.data.0.preview.education.0.title', 'BA Design')
            ->where('jobs.data.0.preview.experience.0.subtitle', 'Studio')
            ->where('jobs.data.0.preview.cover_letter', 'Design systems are my passion.'));
});

test('employer resume download prefers the uploaded profile resume file', function () {
    Storage::fake('local');

    $employer = User::factory()->employer()->create();
    $seeker = User::factory()->jobSeeker()->create(['name' => 'Sara Ali']);
    JobSeekerProfile::factory()->create(['user_id' => $seeker->id]);

    $path = 'resumes/'.$seeker->id.'/profile.pdf';
    Storage::disk('local')->put($path, '%PDF-1.4 profile-file');

    $seeker->forceFill([
        'resume_path' => $path,
        'resume_original_name' => 'Sara_Ali_CV.pdf',
    ])->save();

    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'status' => JobPostStatus::Active,
    ]);

    $application = JobApplication::factory()->create([
        'job_post_id' => $job->id,
        'job_seeker_id' => $seeker->id,
        'resume_path' => null,
        'resume_original_name' => null,
    ]);

    $response = $this->actingAs($employer)
        ->get(route('employer.applications.resume', $application));

    $response->assertOk()->assertDownload('Sara_Ali_CV.pdf');
    expect($response->streamedContent())->toContain('profile-file');
});
