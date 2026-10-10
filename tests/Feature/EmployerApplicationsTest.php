<?php

use App\Enums\JobApplicationStatus;
use App\Enums\JobPostStatus;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\JobSeekerProfile;
use App\Models\User;
use App\Notifications\ApplicationRejectedNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

test('employers see live application table props matching the Figma page', function () {
    Storage::fake('public');

    $employer = User::factory()->employer()->create();
    $seeker = User::factory()->jobSeeker()->create([
        'name' => 'Ahmed Al-Rashidi',
        'email' => 'ahmed.rashidi@email.com',
        'phone' => '+966 50 123 4567',
        'location' => 'Riyadh',
    ]);

    $avatarPath = 'avatars/' . $seeker->id . '/photo.png';
    Storage::disk('public')->put($avatarPath, 'avatar');
    $seeker->forceFill(['avatar' => $avatarPath])->save();

    JobSeekerProfile::factory()->create([
        'user_id' => $seeker->id,
        'headline' => 'Senior Frontend Developer',
        'experience_years' => '6',
        'skills' => ['React', 'TypeScript', 'Tailwind CSS', 'Node.js'],
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
        ->assertInertia(fn($page) => $page
            ->component('backend/User/EmployerApplications')
            ->where('stats.total', 1)
            ->where('stats.interview', 1)
            ->where('stats.shortlisted', 0)
            ->where('applications.0.name', 'Ahmed Al-Rashidi')
            ->where('applications.0.avatar_url', '/storage/' . $avatarPath)
            ->where('applications.0.job', 'Senior Frontend Developer')
            ->where('applications.0.experience_years', '6 years')
            ->where('applications.0.location', 'Riyadh')
            ->where('applications.0.status', 'Interview')
            ->where('applications.0.date', 'Aug 3, 2026')
            ->where('applications.0.phone', '+966 50 123 4567')
            ->where('applications.0.skills', ['React', 'TypeScript', 'Tailwind CSS', 'Node.js'])
            ->where('applications.0.current_title', fn($value) => filled($value))
            ->where('applications.0.experience.0.title', 'Developer')
            ->where('applications.0.cover_letter', 'I would like to join the frontend team.')
            ->where('applications.0.preview_location', 'Riyadh · 6 years')
            ->where('applications.0.timeline.3.label', 'Interview')
            ->where('applications.0.timeline.3.state', 'current')
            ->where('applications.0.next_status', JobApplicationStatus::Offer->value)
            ->where('applications.0.can_move', true)
            ->where('applications.0.can_reject', true)
            ->has('applications.0.resume_url'));
});

test('employers can download an applicant resume from the applications drawer', function () {
    $employer = User::factory()->employer()->create();
    $seeker = User::factory()->jobSeeker()->create([
        'name' => 'Ahmed Al-Rashidi',
        'email' => 'ahmed.rashidi@email.com',
    ]);

    JobSeekerProfile::factory()->create([
        'user_id' => $seeker->id,
        'headline' => 'Senior Frontend Developer',
        'skills' => ['React', 'TypeScript'],
    ]);

    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'status' => JobPostStatus::Active,
    ]);

    $application = JobApplication::factory()->create([
        'job_post_id' => $job->id,
        'job_seeker_id' => $seeker->id,
        'status' => JobApplicationStatus::Interview,
    ]);

    $response = $this->actingAs($employer)
        ->get(route('employer.applications.resume', $application));

    $response->assertOk()->assertDownload('ahmed-al-rashidi-resume.pdf');

    expect($response->streamedContent())
        ->toStartWith('%PDF-1.4')
        ->toContain('Ahmed Al-Rashidi')
        ->toContain('Senior Frontend Developer');
});

test('employers cannot download a resume for another company application', function () {
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
        ->get(route('employer.applications.resume', $application))
        ->assertForbidden();
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
    Notification::fake();

    $employer = User::factory()->employer()->create([
        'company_name' => 'Gulf Relief',
    ]);
    $seeker = User::factory()->jobSeeker()->create();
    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'WASH Officer',
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

    Notification::assertSentTo(
        $seeker,
        ApplicationRejectedNotification::class,
        function (ApplicationRejectedNotification $notification) use ($seeker): bool {
            expect($notification->jobTitle)->toBe('WASH Officer')
                ->and($notification->companyName)->toBe('Gulf Relief')
                ->and($notification->via($seeker))->toContain('mail')
                ->and($notification->toMail($seeker)->subject)
                ->toBe('Your application for WASH Officer was not selected');

            return true;
        },
    );
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
