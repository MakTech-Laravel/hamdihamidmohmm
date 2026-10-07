<?php

use App\Models\JobSeekerProfile;
use App\Models\User;

test('job seeker profile page exposes autosave copy for draft recovery', function () {
    $seeker = User::factory()->jobSeeker()->create();
    JobSeekerProfile::factory()->create(['user_id' => $seeker->id]);

    $this->actingAs($seeker)
        ->get(route('job-seeker.profile'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/User/JobSeekerProfile')
            ->where('translations', fn($translations) => ($translations['job_seeker.profile.autosaved'] ?? null) === 'Draft autosaved'
                && ($translations['job_seeker.profile.autosaved_server'] ?? null) === 'Changes autosaved'
                && ($translations['job_seeker.profile.draft_found'] ?? null) === 'You have unsaved profile changes from a previous session.'
                && ($translations['job_seeker.profile.resume_draft'] ?? null) === 'Resume editing'
                && ($translations['job_seeker.profile.discard_draft'] ?? null) === 'Discard draft'
                && ($translations['job_seeker.profile.restore_draft'] ?? null) === 'Unsaved draft restored'));
});

test('job seeker profile updates can be saved repeatedly without leaving incomplete drafts required', function () {
    $seeker = User::factory()->jobSeeker()->create(['name' => 'Autosave Seeker']);
    JobSeekerProfile::factory()->create(['user_id' => $seeker->id]);

    $payload = [
        'name' => 'Autosave Seeker',
        'phone' => '+249 11 222 3333',
        'location' => 'Khartoum',
        'headline' => 'First draft',
        'current_title' => 'Analyst',
        'experience_years' => '4',
        'bio' => 'Working on profile',
        'linkedin_url' => '',
        'github_url' => '',
        'industry' => 'Technology',
        'expected_salary' => '',
        'availability' => ['Full Time'],
        'skills' => ['Laravel'],
        'education' => [],
        'experience' => [],
        'languages' => [],
        'certifications' => [],
        'references' => [],
    ];

    $this->actingAs($seeker)
        ->put(route('job-seeker.profile.update'), $payload)
        ->assertRedirect();

    $payload['headline'] = 'Autosaved headline';
    $payload['skills'] = ['Laravel', 'React'];

    $this->actingAs($seeker)
        ->put(route('job-seeker.profile.update'), $payload)
        ->assertRedirect();

    $profile = $seeker->fresh()->jobSeekerProfile;

    expect($profile?->headline)->toBe('Autosaved headline')
        ->and($profile?->skills)->toBe(['Laravel', 'React']);
});
