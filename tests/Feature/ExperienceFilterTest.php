<?php

use App\Enums\JobApplicationStatus;
use App\Enums\JobPostStatus;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\JobSeekerProfile;
use App\Models\PlatformSetting;
use App\Models\User;
use App\Support\ExperienceFilterOptions;

test('employers can filter and sort applications by experience ranges', function () {
    $employer = User::factory()->employer()->create();
    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'status' => JobPostStatus::Active,
    ]);

    foreach (
        [
            ['name' => 'Junior', 'years' => '2'],
            ['name' => 'Mid', 'years' => '5'],
            ['name' => 'Senior', 'years' => '12'],
        ] as $candidate
    ) {
        $seeker = User::factory()->jobSeeker()->create(['name' => $candidate['name']]);
        JobSeekerProfile::factory()->create([
            'user_id' => $seeker->id,
            'experience_years' => $candidate['years'],
        ]);
        JobApplication::factory()->create([
            'job_post_id' => $job->id,
            'job_seeker_id' => $seeker->id,
            'status' => JobApplicationStatus::Applied,
        ]);
    }

    $this->actingAs($employer)
        ->get(route('employer.applications', ['experience' => '3-5']))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->has('applications', 1)
            ->where('applications.0.name', 'Mid')
            ->where('filters.experience', '3-5')
            ->has('experience_options'));

    $this->actingAs($employer)
        ->get(route('employer.applications', ['experience_sort' => 'desc']))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->where('applications.0.name', 'Senior')
            ->where('applications.2.name', 'Junior'));
});

test('admins can configure experience filter ranges used by employers', function () {
    $admin = User::factory()->admin()->create();
    $employer = User::factory()->employer()->create();

    $this->actingAs($admin)
        ->put(route('admin.settings.update'), [
            'group' => 'experience_filters',
            'values' => [
                'ranges' => [
                    ['key' => '0-1', 'label' => 'Fresh', 'min' => 0, 'max' => 1, 'enabled' => true],
                    ['key' => '2-4', 'label' => 'Growing', 'min' => 2, 'max' => 4, 'enabled' => false],
                ],
            ],
        ])
        ->assertRedirect();

    expect(ExperienceFilterOptions::enabled())->toHaveCount(1)
        ->and(ExperienceFilterOptions::enabled()[0]['key'])->toBe('0-1');

    $this->actingAs($employer)
        ->get(route('employer.applications'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->has('experience_options', 1)
            ->where('experience_options.0.key', '0-1')
            ->where('experience_options.0.label', 'Fresh'));

    $this->actingAs($admin)
        ->get(route('admin.applications.index'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->has('experience_options', 1)
            ->where('filters.experience', ''));
});

test('disabled experience ranges are ignored when filtering', function () {
    PlatformSetting::query()->updateOrCreate(
        ['key' => 'experience_filters'],
        ['value' => [
            'ranges' => [
                ['key' => '3-5', 'label' => 'Mid', 'min' => 3, 'max' => 5, 'enabled' => false],
            ],
        ]],
    );

    $employer = User::factory()->employer()->create();
    $seeker = User::factory()->jobSeeker()->create();
    JobSeekerProfile::factory()->create([
        'user_id' => $seeker->id,
        'experience_years' => '4',
    ]);
    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'status' => JobPostStatus::Active,
    ]);
    JobApplication::factory()->create([
        'job_post_id' => $job->id,
        'job_seeker_id' => $seeker->id,
    ]);

    $this->actingAs($employer)
        ->get(route('employer.applications', ['experience' => '3-5']))
        ->assertOk()
        ->assertInertia(fn($page) => $page->has('applications', 1));
});
