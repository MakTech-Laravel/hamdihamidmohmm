<?php

use App\Enums\JobApplicationStatus;
use App\Enums\JobPostStatus;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\JobSeekerProfile;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

test('admin applications monitoring includes dynamic applicant preview details', function () {
    $admin = User::factory()->admin()->create();
    $employer = User::factory()->employer()->create([
        'company_name' => 'Nova Labs',
    ]);
    $seeker = User::factory()->jobSeeker()->create([
        'name' => 'Fatima Hassan',
        'email' => 'fatima@example.com',
        'phone' => '+966 55 111 2222',
        'location' => 'Dammam',
    ]);

    JobSeekerProfile::factory()->create([
        'user_id' => $seeker->id,
        'headline' => 'Product Designer',
        'current_title' => 'Senior Designer',
        'experience_years' => '5',
        'industry' => 'Design',
        'skills' => ['Figma', 'Research'],
        'education' => [['degree' => 'BA Design', 'school' => 'KSU', 'years' => '2018']],
        'experience' => [['title' => 'Designer', 'company' => 'Studio', 'dates' => '2021 - Present']],
        'languages' => [['name' => 'Arabic', 'level' => 'Native']],
        'certifications' => [['name' => 'UX Cert', 'issuer' => 'NN/g', 'date' => '2024']],
    ]);

    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'Senior Product Designer',
        'status' => JobPostStatus::Active,
    ]);

    JobApplication::factory()->create([
        'job_post_id' => $job->id,
        'job_seeker_id' => $seeker->id,
        'status' => JobApplicationStatus::Interview,
        'cover_letter' => 'I would love to join Nova Labs.',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.applications.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/Admin/ApplicationsMonitoring')
            ->where('applications.data.0.seeker', 'Fatima Hassan')
            ->where('applications.data.0.job', 'Senior Product Designer')
            ->where('applications.data.0.employer', 'Nova Labs')
            ->where('applications.data.0.preview.is_applicant', true)
            ->where('applications.data.0.preview.current_title', 'Senior Designer')
            ->where('applications.data.0.preview.experience_years', '5 years')
            ->where('applications.data.0.preview.skills', ['Figma', 'Research'])
            ->where('applications.data.0.preview.education.0.title', 'BA Design')
            ->where('applications.data.0.preview.experience.0.subtitle', 'Studio')
            ->where('applications.data.0.preview.cover_letter', 'I would love to join Nova Labs.')
            ->where('applications.data.0.resume_url', route('admin.applications.resume', JobApplication::query()->first()))
            ->has('applications.data.0.preview.timeline'));
});

test('admins can download an applicant resume from applications monitoring', function () {
    Storage::fake('local');

    $admin = User::factory()->admin()->create();
    $seeker = User::factory()->jobSeeker()->create(['name' => 'Omar Nasser']);
    JobSeekerProfile::factory()->create(['user_id' => $seeker->id]);

    $path = 'resumes/'.$seeker->id.'/profile.pdf';
    Storage::disk('local')->put($path, '%PDF-1.4 admin-monitoring-resume');

    $seeker->forceFill([
        'resume_path' => $path,
        'resume_original_name' => 'Omar_Nasser_CV.pdf',
    ])->save();

    $job = JobPost::factory()->create(['status' => JobPostStatus::Active]);
    $application = JobApplication::factory()->create([
        'job_post_id' => $job->id,
        'job_seeker_id' => $seeker->id,
        'resume_path' => null,
    ]);

    $response = $this->actingAs($admin)
        ->get(route('admin.applications.resume', $application));

    $response->assertOk()->assertDownload('Omar_Nasser_CV.pdf');
    expect($response->streamedContent())->toContain('admin-monitoring-resume');
});
