<?php

use App\Models\JobSeekerProfile;
use App\Models\User;

test('job seekers can update education experience languages and certifications with matching field shapes', function () {
    $seeker = User::factory()->jobSeeker()->create(['name' => 'Noura Saeed']);

    JobSeekerProfile::factory()->create(['user_id' => $seeker->id]);

    $this->actingAs($seeker)
        ->from(route('job-seeker.profile'))
        ->put(route('job-seeker.profile.update'), [
            'name' => 'Noura Saeed',
            'phone' => '+966 50 123 4567',
            'location' => 'Jeddah',
            'headline' => 'Full Stack Developer',
            'current_title' => 'Software Engineer',
            'experience_years' => '5',
            'bio' => 'Builds products.',
            'linkedin_url' => 'https://linkedin.com/in/noura',
            'github_url' => 'https://github.com/noura',
            'industry' => 'Technology',
            'expected_salary' => 'SAR 15,000 - 20,000',
            'availability' => ['Full Time'],
            'skills' => ['Laravel', 'React'],
            'education' => [[
                'degree' => 'BSc Software Engineering',
                'school' => 'King Abdulaziz University',
                'field' => 'Software Engineering',
                'years' => '2016 - 2020',
            ]],
            'experience' => [[
                'title' => 'Backend Developer',
                'company' => 'Acme',
                'dates' => '2021 - Present',
                'years' => 4,
                'description' => 'API work',
            ]],
            'languages' => [[
                'name' => 'Arabic',
                'level' => 'Native',
            ]],
            'certifications' => [[
                'name' => 'Laravel Certified',
                'issuer' => 'Laravel',
                'date' => '2025-01',
            ]],
        ])
        ->assertRedirect(route('job-seeker.profile'));

    $profile = $seeker->fresh()->jobSeekerProfile;

    expect($profile?->education)->toBe([[
        'degree' => 'BSc Software Engineering',
        'school' => 'King Abdulaziz University',
        'field' => 'Software Engineering',
        'years' => '2016 - 2020',
    ]])
        ->and($profile?->experience_years)->toBe('5')
        ->and($profile?->experience)->toBe([[
            'title' => 'Backend Developer',
            'company' => 'Acme',
            'dates' => '2021 - Present',
            'years' => 4,
            'description' => 'API work',
        ]])
        ->and($profile?->languages)->toBe([[
            'name' => 'Arabic',
            'level' => 'Native',
        ]])
        ->and($profile?->certifications)->toBe([[
            'name' => 'Laravel Certified',
            'issuer' => 'Laravel',
            'date' => '2025-01',
        ]]);

    $this->actingAs($seeker)
        ->get(route('job-seeker.profile'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/User/JobSeekerProfile')
            ->where('profile.education.0.degree', 'BSc Software Engineering')
            ->where('profile.experience.0.title', 'Backend Developer')
            ->where('profile.languages.0.name', 'Arabic')
            ->where('profile.certifications.0.name', 'Laravel Certified')
            ->where('profile.experience_years', '5')
            ->where('profile.experience_years_label', '5 years')
            ->where('translations', fn($translations) => ($translations['job_seeker.profile.title'] ?? null) === 'My Profile'
                && ($translations['job_seeker.profile.add_language'] ?? null) === '+ Add Language'
                && ($translations['job_seeker.profile.save'] ?? null) === 'Save Changes'));
});

test('job seeker profile translation keys exist in english and arabic', function () {
    $english = json_decode((string) file_get_contents(lang_path('en.json')), true);
    $arabic = json_decode((string) file_get_contents(lang_path('ar.json')), true);

    expect($english)->toBeArray()
        ->and($arabic)->toBeArray();

    $keys = array_values(array_filter(
        array_keys($english),
        fn(string $key): bool => str_starts_with($key, 'job_seeker.profile.'),
    ));

    expect($keys)->not->toBeEmpty();

    foreach ($keys as $key) {
        expect($arabic)->toHaveKey($key)
            ->and($english[$key])->not->toBe('')
            ->and($arabic[$key])->not->toBe('');
    }
});
