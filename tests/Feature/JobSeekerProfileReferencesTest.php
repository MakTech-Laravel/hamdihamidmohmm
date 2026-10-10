<?php

use App\Models\JobSeekerProfile;
use App\Models\User;

test('job seekers can save optional references on their profile', function () {
    $seeker = User::factory()->jobSeeker()->create(['name' => 'Sara Ali']);

    JobSeekerProfile::factory()->create(['user_id' => $seeker->id]);

    $this->actingAs($seeker)
        ->from(route('job-seeker.profile'))
        ->put(route('job-seeker.profile.update'), [
            'name' => 'Sara Ali',
            'phone' => '+249 12 345 6789',
            'location' => 'Khartoum',
            'headline' => 'Analyst',
            'current_title' => 'Analyst',
            'experience_years' => '3',
            'bio' => 'Works carefully.',
            'linkedin_url' => '',
            'github_url' => '',
            'industry' => 'Finance',
            'expected_salary' => '',
            'availability' => [],
            'skills' => [],
            'education' => [],
            'experience' => [],
            'languages' => [],
            'certifications' => [],
            'references' => [[
                'name' => 'Dr. Hassan Omar',
                'address' => 'Nile Street, Khartoum',
                'relationship' => 'Former Manager',
            ]],
        ])
        ->assertRedirect(route('job-seeker.profile'));

    $profile = $seeker->fresh()->jobSeekerProfile;

    expect($profile?->references)->toBe([[
        'name' => 'Dr. Hassan Omar',
        'address' => 'Nile Street, Khartoum',
        'relationship' => 'Former Manager',
    ]]);

    $this->actingAs($seeker)
        ->get(route('job-seeker.profile'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/User/JobSeekerProfile')
            ->where('profile.references.0.name', 'Dr. Hassan Omar')
            ->where('profile.references.0.address', 'Nile Street, Khartoum')
            ->where('profile.references.0.relationship', 'Former Manager')
            ->where('profile.checklist', fn ($checklist) => collect($checklist)
                ->contains(fn ($item) => ($item['id'] ?? null) === 'references'
                    && ($item['complete'] ?? false) === true))
            ->where('translations', fn ($translations) => ($translations['job_seeker.profile.references'] ?? null) === 'References'
                && ($translations['job_seeker.profile.reference_name'] ?? null) === 'Reference Name'
                && ($translations['job_seeker.profile.reference_address'] ?? null) === 'Address'
                && ($translations['job_seeker.profile.reference_relationship'] ?? null) === 'Relationship'));
});

test('job seekers can leave references empty because the section is optional', function () {
    $seeker = User::factory()->jobSeeker()->create(['name' => 'Optional Refs']);

    JobSeekerProfile::factory()->create([
        'user_id' => $seeker->id,
        'references' => [[
            'name' => 'Old Reference',
            'address' => 'Old Address',
            'relationship' => 'Colleague',
        ]],
    ]);

    $this->actingAs($seeker)
        ->from(route('job-seeker.profile'))
        ->put(route('job-seeker.profile.update'), [
            'name' => 'Optional Refs',
            'phone' => '+249 99 000 1111',
            'location' => 'Omdurman',
            'headline' => 'Designer',
            'current_title' => 'Designer',
            'experience_years' => '2',
            'bio' => 'Designs things.',
            'linkedin_url' => '',
            'github_url' => '',
            'industry' => 'Design',
            'expected_salary' => '',
            'availability' => [],
            'skills' => [],
            'education' => [],
            'experience' => [],
            'languages' => [],
            'certifications' => [],
            'references' => [],
        ])
        ->assertRedirect(route('job-seeker.profile'));

    expect($seeker->fresh()->jobSeekerProfile?->references)->toBe([]);
});
