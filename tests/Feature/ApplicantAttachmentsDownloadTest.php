<?php

use App\Enums\JobApplicationStatus;
use App\Enums\JobPostStatus;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\JobSeekerProfile;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');
});

test('employers can download applicant certificate attachments and credentials', function () {
    $employer = User::factory()->employer()->create();
    $otherEmployer = User::factory()->employer()->create();
    $seeker = User::factory()->jobSeeker()->create();

    $degreePath = 'degrees/' . $seeker->id . '/degree.pdf';
    $otherPath = 'other/' . $seeker->id . '/portfolio.pdf';
    $certPath = 'certifications/' . $seeker->id . '/aws.pdf';

    Storage::disk('local')->put($degreePath, 'degree');
    Storage::disk('local')->put($otherPath, 'other');
    Storage::disk('local')->put($certPath, 'cert');

    $seeker->forceFill([
        'highest_degree_path' => $degreePath,
        'highest_degree_original_name' => 'degree.pdf',
        'other_document_path' => $otherPath,
        'other_document_original_name' => 'portfolio.pdf',
    ])->save();

    JobSeekerProfile::factory()->create([
        'user_id' => $seeker->id,
        'certifications' => [[
            'name' => 'AWS Certified',
            'issuer' => 'Amazon',
            'date' => '2024',
            'attachments' => [[
                'file_path' => $certPath,
                'file_name' => 'aws.pdf',
            ]],
        ]],
    ]);

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
        ->get(route('employer.applications'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->where('applications.0.highest_degree_name', 'degree.pdf')
            ->where(
                'applications.0.highest_degree_url',
                route('employer.applications.highest-degree', $application),
            )
            ->where('applications.0.other_document_name', 'portfolio.pdf')
            ->where(
                'applications.0.certifications.0.attachments.0.file_name',
                'aws.pdf',
            )
            ->where(
                'applications.0.certifications.0.attachments.0.download_url',
                route('employer.applications.certifications', [
                    'application' => $application,
                    'index' => 0,
                    'attachment' => 0,
                ]),
            ));

    $this->actingAs($employer)
        ->get(route('employer.applications.highest-degree', $application))
        ->assertOk()
        ->assertDownload('degree.pdf');

    $this->actingAs($employer)
        ->get(route('employer.applications.other-document', $application))
        ->assertOk()
        ->assertDownload('portfolio.pdf');

    $this->actingAs($employer)
        ->get(route('employer.applications.certifications', [
            'application' => $application,
            'index' => 0,
            'attachment' => 0,
        ]))
        ->assertOk()
        ->assertDownload('aws.pdf');

    $this->actingAs($otherEmployer)
        ->get(route('employer.applications.highest-degree', $application))
        ->assertForbidden();
});

test('admins can download applicant credential attachments', function () {
    $admin = User::factory()->admin()->create();
    $employer = User::factory()->employer()->create();
    $seeker = User::factory()->jobSeeker()->create();

    $degreePath = 'degrees/' . $seeker->id . '/degree.pdf';
    Storage::disk('local')->put($degreePath, 'degree');
    $seeker->forceFill([
        'highest_degree_path' => $degreePath,
        'highest_degree_original_name' => 'degree.pdf',
    ])->save();

    JobSeekerProfile::factory()->create(['user_id' => $seeker->id]);

    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'status' => JobPostStatus::Active,
    ]);
    $application = JobApplication::factory()->create([
        'job_post_id' => $job->id,
        'job_seeker_id' => $seeker->id,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.applications.highest-degree', $application))
        ->assertOk()
        ->assertDownload('degree.pdf');
});
