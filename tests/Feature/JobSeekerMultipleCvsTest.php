<?php

use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\JobSeekerCv;
use App\Models\JobSeekerProfile;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('job seekers can upload and manage multiple labeled cvs', function () {
    Storage::fake('local');

    $seeker = User::factory()->jobSeeker()->create();
    JobSeekerProfile::factory()->create(['user_id' => $seeker->id]);

    $first = UploadedFile::fake()->createWithContent('it-support.pdf', '%PDF-1.4 support');
    $second = UploadedFile::fake()->createWithContent('it-admin.pdf', '%PDF-1.4 admin');

    $this->actingAs($seeker)
        ->post(route('job-seeker.profile.cvs.store'), [
            'resume' => $first,
            'label' => 'IT Support',
            'make_default' => true,
            'extract_profile' => false,
        ])
        ->assertRedirect();

    $this->actingAs($seeker)
        ->post(route('job-seeker.profile.cvs.store'), [
            'resume' => $second,
            'label' => 'IT Administrator',
            'make_default' => false,
            'extract_profile' => false,
        ])
        ->assertRedirect();

    $cvs = JobSeekerCv::query()->where('user_id', $seeker->id)->orderBy('id')->get();

    expect($cvs)->toHaveCount(2)
        ->and($cvs[0]->label)->toBe('IT Support')
        ->and($cvs[0]->is_default)->toBeTrue()
        ->and($cvs[1]->label)->toBe('IT Administrator')
        ->and($cvs[1]->is_default)->toBeFalse()
        ->and($seeker->fresh()->resume_original_name)->toBe('it-support.pdf');

    $this->actingAs($seeker)
        ->put(route('job-seeker.profile.cvs.update', $cvs[1]), [
            'make_default' => true,
        ])
        ->assertRedirect();

    expect($cvs[1]->fresh()->is_default)->toBeTrue()
        ->and($cvs[0]->fresh()->is_default)->toBeFalse()
        ->and($seeker->fresh()->resume_original_name)->toBe('it-admin.pdf');

    $this->actingAs($seeker)
        ->get(route('job-seeker.profile'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/User/JobSeekerProfile')
            ->has('profile.cvs', 2)
            ->where('profile.cvs.0.label', 'IT Administrator')
            ->where('profile.cvs.0.is_default', true)
            ->where('translations', fn($translations) => ($translations['job_seeker.profile.cvs_title'] ?? null) === 'Your CVs'));
});

test('apply uses the only cv automatically and requires selection when multiple exist', function () {
    Storage::fake('local');

    $seeker = User::factory()->jobSeeker()->create();
    JobSeekerProfile::factory()->create(['user_id' => $seeker->id]);
    $jobOne = JobPost::factory()->create();
    $jobTwo = JobPost::factory()->create();

    $support = JobSeekerCv::factory()->for($seeker)->default()->withStoredFile('%PDF-1.4 support')->create([
        'label' => 'IT Support',
        'original_name' => 'support.pdf',
        'file_path' => 'resumes/' . $seeker->id . '/support.pdf',
    ]);
    $seeker->syncDefaultResumeFromCvs();

    $this->actingAs($seeker)
        ->post(route('jobs.apply', $jobOne), [
            'cover_letter' => 'Applying with my only CV.',
        ])
        ->assertRedirect();

    $firstApplication = JobApplication::query()
        ->where('job_post_id', $jobOne->id)
        ->where('job_seeker_id', $seeker->id)
        ->first();

    expect($firstApplication?->resume_original_name)->toBe('support.pdf')
        ->and($firstApplication?->resume_path)->not->toBeNull()
        ->and(Storage::disk('local')->exists((string) $firstApplication?->resume_path))->toBeTrue();

    $admin = JobSeekerCv::factory()->for($seeker)->withStoredFile('%PDF-1.4 admin')->create([
        'label' => 'IT Administrator',
        'original_name' => 'admin.pdf',
        'file_path' => 'resumes/' . $seeker->id . '/admin.pdf',
        'is_default' => false,
    ]);

    $this->actingAs($seeker)
        ->from(route('jobs.show', $jobTwo->slug))
        ->post(route('jobs.apply', $jobTwo), [
            'cover_letter' => 'Need to pick a CV.',
        ])
        ->assertRedirect(route('jobs.show', $jobTwo->slug))
        ->assertSessionHasErrors('cv_id');

    $this->actingAs($seeker)
        ->post(route('jobs.apply', $jobTwo), [
            'cover_letter' => 'Applying with admin CV.',
            'cv_id' => $admin->id,
        ])
        ->assertRedirect();

    $secondApplication = JobApplication::query()
        ->where('job_post_id', $jobTwo->id)
        ->where('job_seeker_id', $seeker->id)
        ->first();

    expect($secondApplication?->resume_original_name)->toBe('admin.pdf');

    $this->actingAs($seeker)
        ->get(route('jobs.show', $jobTwo->slug))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->has('applicant_cvs', 2)
            ->where('applicant_cvs.0.id', $support->fresh()->is_default ? $support->id : $admin->id));
});
