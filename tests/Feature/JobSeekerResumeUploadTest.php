<?php

use App\Enums\JobSeekerResumeStatus;
use App\Models\JobPost;
use App\Models\JobSeekerProfile;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('job seekers can upload download and remove a profile resume', function () {
    Storage::fake('local');

    $seeker = User::factory()->jobSeeker()->create();
    JobSeekerProfile::factory()->create(['user_id' => $seeker->id]);

    $resume = UploadedFile::fake()->createWithContent(
        'noura-cv.pdf',
        '%PDF-1.4 profile-resume',
    );

    $this->actingAs($seeker)
        ->from(route('job-seeker.profile'))
        ->post(route('job-seeker.profile.resume.upload'), [
            'resume' => $resume,
        ])
        ->assertRedirect(route('job-seeker.profile'));

    $seeker->refresh();

    expect($seeker->resume_original_name)->toBe('noura-cv.pdf')
        ->and($seeker->resume_status)->toBe(JobSeekerResumeStatus::Active)
        ->and($seeker->resume_path)->not->toBeNull()
        ->and(Storage::disk('local')->exists((string) $seeker->resume_path))->toBeTrue();

    $this->actingAs($seeker)
        ->get(route('job-seeker.profile'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->where('profile.resume_name', 'noura-cv.pdf')
            ->where('profile.resume_status', 'Active')
            ->where('profile.resume_url', route('job-seeker.profile.resume.download'))
            ->where('profile.checklist.7.complete', true));

    $this->actingAs($seeker)
        ->get(route('job-seeker.profile.resume.download'))
        ->assertOk()
        ->assertDownload('noura-cv.pdf');

    $this->actingAs($seeker)
        ->from(route('job-seeker.profile'))
        ->delete(route('job-seeker.profile.resume.destroy'))
        ->assertRedirect(route('job-seeker.profile'));

    $seeker->refresh();

    expect($seeker->resume_path)->toBeNull()
        ->and($seeker->resume_original_name)->toBeNull()
        ->and($seeker->resume_status)->toBeNull();
});

test('job applications reuse the profile resume when no file is uploaded', function () {
    Storage::fake('local');

    $seeker = User::factory()->jobSeeker()->create();
    JobSeekerProfile::factory()->create(['user_id' => $seeker->id]);
    $job = JobPost::factory()->create();

    $path = 'resumes/' . $seeker->id . '/profile.pdf';
    Storage::disk('local')->put($path, '%PDF-1.4 saved-profile-resume');

    $seeker->forceFill([
        'resume_path' => $path,
        'resume_original_name' => 'Profile_CV.pdf',
        'resume_status' => JobSeekerResumeStatus::Active,
    ])->save();

    $this->actingAs($seeker)
        ->post(route('jobs.apply', $job), [
            'cover_letter' => 'Interested in this role.',
        ])
        ->assertRedirect();

    $application = $seeker->fresh()->jobApplications()->first();

    expect($application?->resume_original_name)->toBe('Profile_CV.pdf')
        ->and($application?->resume_path)->not->toBeNull()
        ->and($application?->resume_path)->not->toBe($path)
        ->and(Storage::disk('local')->exists((string) $application?->resume_path))->toBeTrue()
        ->and(Storage::disk('local')->get((string) $application?->resume_path))->toContain('saved-profile-resume');
});
