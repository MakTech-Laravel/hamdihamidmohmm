<?php

use App\Enums\JobApplicationStatus;
use App\Enums\JobPostStatus;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\JobSeekerProfile;
use App\Models\User;
use App\Notifications\PortalNotification;

test('job seeker dashboard matches the Figma stats checklist and notifications props', function () {
    $seeker = User::factory()->jobSeeker()->create([
        'name' => 'Ahmed Al-Rashidi',
        'phone' => '+966 50 123 4567',
        'location' => 'Riyadh',
    ]);

    JobSeekerProfile::factory()->create([
        'user_id' => $seeker->id,
        'headline' => 'Senior Frontend Developer',
        'skills' => ['React', 'TypeScript'],
        'education' => [['degree' => 'BSc', 'school' => 'KFUPM']],
        'experience' => [],
        'certifications' => [],
    ]);

    $job = JobPost::factory()->create([
        'title' => 'Senior Frontend Developer',
        'status' => JobPostStatus::Active,
    ]);

    JobApplication::factory()->create([
        'job_post_id' => $job->id,
        'job_seeker_id' => $seeker->id,
        'status' => JobApplicationStatus::UnderReview,
    ]);

    JobApplication::factory()->create([
        'job_post_id' => JobPost::factory()->create(['status' => JobPostStatus::Active])->id,
        'job_seeker_id' => $seeker->id,
        'status' => JobApplicationStatus::Shortlisted,
    ]);

    $seeker->notify(new PortalNotification(
        'Interview Invitation',
        'You have been invited to interview.',
        'interview',
    ));

    $this->actingAs($seeker)
        ->get(route('job-seeker.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/User/JobSeekerDashboard')
            ->where('stats.total', 2)
            ->where('stats.under_review', 1)
            ->where('stats.shortlisted', 1)
            ->has('stats.completion')
            ->has('checklist')
            ->where('applications.0.status', 'Under Review')
            ->where('notifications.0.title', 'Interview Invitation')
            ->where('notifications.0.read', false)
            ->missing('stats.active')
            ->missing('stats.interviews'));
});

test('job seekers can update extended professional profile fields', function () {
    $seeker = User::factory()->jobSeeker()->create(['name' => 'Ali Khan']);

    JobSeekerProfile::factory()->create(['user_id' => $seeker->id]);

    $this->actingAs($seeker)
        ->put(route('job-seeker.profile.update'), [
            'name' => 'Ali Khan',
            'phone' => '+971 50 111 2222',
            'location' => 'Dubai, UAE',
            'headline' => 'Senior Frontend Developer',
            'current_title' => 'Frontend Lead',
            'bio' => 'Builds interfaces.',
            'linkedin_url' => 'https://linkedin.com/in/ali',
            'github_url' => 'https://github.com/ali',
            'industry' => 'Information Technology',
            'expected_salary' => 'SAR 18,000 - 22,000',
            'availability' => ['Full Time', 'Remote'],
            'skills' => ['React', 'TypeScript'],
            'education' => [['degree' => 'BSc CS', 'school' => 'KFUPM', 'years' => '2015 - 2019']],
            'experience' => [['title' => 'Developer', 'company' => 'Nova', 'years' => 3]],
            'languages' => [['name' => 'English', 'level' => 'Advanced']],
            'certifications' => [['name' => 'AWS', 'issuer' => 'Amazon', 'date' => '2024-03']],
        ])
        ->assertRedirect();

    $profile = $seeker->fresh()->jobSeekerProfile;

    expect($profile)->not->toBeNull()
        ->and($profile?->current_title)->toBe('Frontend Lead')
        ->and($profile?->linkedin_url)->toBe('https://linkedin.com/in/ali')
        ->and($profile?->github_url)->toBe('https://github.com/ali')
        ->and($profile?->industry)->toBe('Information Technology')
        ->and($profile?->expected_salary)->toBe('SAR 18,000 - 22,000')
        ->and($profile?->availability)->toBe(['Full Time', 'Remote']);
});

test('job seekers can save professional fields from comma-separated form strings', function () {
    $seeker = User::factory()->jobSeeker()->create(['name' => 'Sara Ali']);

    JobSeekerProfile::factory()->create([
        'user_id' => $seeker->id,
        'current_title' => null,
        'industry' => null,
        'expected_salary' => null,
        'availability' => null,
    ]);

    $this->actingAs($seeker)
        ->from(route('job-seeker.profile'))
        ->put(route('job-seeker.profile.update'), [
            'name' => 'Sara Ali',
            'phone' => '+971 50 000 1111',
            'location' => 'Riyadh',
            'headline' => 'Product Designer',
            'current_title' => 'Ipsa natus ut et te',
            'bio' => 'Designer bio',
            'linkedin_url' => '',
            'github_url' => '',
            'industry' => 'Molestiae eiusmod nu',
            'expected_salary' => 'Tempore suscipit in',
            'availability' => 'Full Time, Remote',
            'skills' => 'Figma, React',
            'education' => '[]',
            'experience' => '[]',
            'languages' => '[]',
            'certifications' => '[]',
        ])
        ->assertRedirect(route('job-seeker.profile'));

    $profile = $seeker->fresh()->jobSeekerProfile;

    expect($profile?->current_title)->toBe('Ipsa natus ut et te')
        ->and($profile?->industry)->toBe('Molestiae eiusmod nu')
        ->and($profile?->expected_salary)->toBe('Tempore suscipit in')
        ->and($profile?->availability)->toBe(['Full Time', 'Remote'])
        ->and($profile?->skills)->toBe(['Figma', 'React']);

    $this->actingAs($seeker)
        ->get(route('job-seeker.profile'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('profile.current_title', 'Ipsa natus ut et te')
            ->where('profile.industry', 'Molestiae eiusmod nu')
            ->where('profile.expected_salary', 'Tempore suscipit in')
            ->where('profile.availability', ['Full Time', 'Remote']));
});

test('job seeker applications page includes filter counts and job urls', function () {
    $seeker = User::factory()->jobSeeker()->create();
    $job = JobPost::factory()->create([
        'title' => 'UX Designer',
        'slug' => 'ux-designer-demo',
        'status' => JobPostStatus::Active,
    ]);

    JobApplication::factory()->create([
        'job_post_id' => $job->id,
        'job_seeker_id' => $seeker->id,
        'status' => JobApplicationStatus::Interview,
    ]);

    $this->actingAs($seeker)
        ->get(route('job-seeker.applications'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/User/JobSeekerApplications')
            ->where('stats.total', 1)
            ->where('stats.interviews', 1)
            ->where('filters.3.value', 'interview')
            ->where('filters.3.count', 1)
            ->where('applications.0.slug', 'ux-designer-demo')
            ->where('applications.0.job_url', route('jobs.show', 'ux-designer-demo'))
            ->where('applications.0.progress', 4));
});
