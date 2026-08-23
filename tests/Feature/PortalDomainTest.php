<?php

use App\Enums\JobApplicationStatus;
use App\Enums\JobPostStatus;
use App\Enums\PaymentStatus;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\Package;
use App\Models\Payment;
use App\Models\User;
use App\Notifications\PortalNotification;
use Illuminate\Support\Facades\Notification;

test('employer can create a pending job and admin can approve it onto the public board', function () {
    $employer = User::factory()->employer()->create();
    $admin = User::factory()->admin()->create();

    $this->actingAs($employer)
        ->post(route('employer.jobs.store'), [
            'title' => 'Senior Laravel Engineer',
            'location' => 'Dubai, UAE',
            'employment_type' => 'Full-time',
            'description' => 'Build the job portal.',
        ])
        ->assertRedirect();

    $job = JobPost::query()->first();

    expect($job)->not->toBeNull()
        ->and($job->status)->toBe(JobPostStatus::Pending)
        ->and($job->employer_id)->toBe($employer->id);

    $this->actingAs($admin)
        ->post(route('admin.jobs.approve', $job))
        ->assertRedirect();

    expect($job->fresh()->status)->toBe(JobPostStatus::Active);

    $this->get(route('jobs'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('frontend/jobs')
            ->where('jobs.data.0.title', 'Senior Laravel Engineer'));

    $this->get(route('jobs.show', $job->slug))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('frontend/job-show')
            ->where('job.slug', $job->slug)
            ->where('job.title', 'Senior Laravel Engineer'));
});

test('a seeker can apply once, see employer status updates, and withdraw', function () {
    $employer = User::factory()->employer()->create();
    $seeker = User::factory()->jobSeeker()->create();
    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'status' => JobPostStatus::Active,
    ]);

    $this->actingAs($seeker)
        ->post(route('jobs.apply', $job), ['cover_letter' => 'I am a great fit.'])
        ->assertRedirect();

    $application = JobApplication::query()->first();

    expect($application)->not->toBeNull()
        ->and($application->status)->toBe(JobApplicationStatus::Applied);

    $this->actingAs($seeker)
        ->post(route('jobs.apply', $job))
        ->assertRedirect();

    expect(JobApplication::query()->count())->toBe(1);

    $this->actingAs($employer)
        ->put(route('employer.applications.update', $application), [
            'status' => JobApplicationStatus::Interview->value,
        ])
        ->assertRedirect();

    expect($application->fresh()->status)->toBe(JobApplicationStatus::Interview);

    $this->actingAs($seeker)
        ->get(route('job-seeker.applications'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('applications.0.status_value', JobApplicationStatus::Interview->value)
            ->where('applications.0.can_withdraw', true));

    $this->actingAs($seeker)
        ->post(route('job-seeker.applications.withdraw', $application))
        ->assertRedirect();

    expect($application->fresh()->status)->toBe(JobApplicationStatus::Withdrawn);
});

test('admin module indexes receive live props', function (string $route, string $prop) {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route($route))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has($prop));
})->with([
    ['admin.jobs.index', 'jobs'],
    ['admin.applications.index', 'applications'],
    ['admin.packages.index', 'packages'],
    ['admin.payments.index', 'payments'],
    ['admin.verifications.index', 'pending'],
    ['admin.content.index', 'pages'],
    ['admin.settings.index', 'settings'],
    ['admin.reports.index', 'reports'],
    ['admin.notifications.index', 'notifications'],
]);

test('job seekers cannot open employer or admin portals', function () {
    $seeker = User::factory()->jobSeeker()->create();

    $this->actingAs($seeker)
        ->get(route('employer.dashboard'))
        ->assertRedirect(route('job-seeker.dashboard'));

    $this->actingAs($seeker)
        ->get(route('admin.jobs.index'))
        ->assertRedirect(route('job-seeker.dashboard'));
});

test('dashboard counts match created records', function () {
    $admin = User::factory()->admin()->create();
    $employer = User::factory()->employer()->create();
    $activeJob = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'status' => JobPostStatus::Active,
    ]);
    JobPost::factory()->pending()->create([
        'employer_id' => $employer->id,
    ]);
    JobApplication::factory()->create([
        'job_post_id' => $activeJob->id,
    ]);
    Payment::factory()->create([
        'employer_id' => $employer->id,
        'status' => PaymentStatus::Completed,
        'amount' => 799,
        'paid_at' => now(),
    ]);

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('stats.active_jobs', 1)
            ->where('stats.pending_jobs', 1)
            ->where('stats.applications_today', 1)
            ->where('stats.monthly_revenue', 799)
            ->where('stats.currency', 'SGD'));

    $this->actingAs($employer)
        ->get(route('employer.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('stats.total_jobs', 2)
            ->where('stats.active_jobs', 1)
            ->has('plan'));
});

test('admin can record a payment and send a notification', function () {
    Notification::fake();

    $admin = User::factory()->admin()->create();
    $employer = User::factory()->employer()->create();
    $package = Package::factory()->create(['slug' => 'professional', 'price' => 299]);

    $this->actingAs($admin)
        ->post(route('admin.payments.store'), [
            'employer_id' => $employer->id,
            'package_id' => $package->id,
            'amount' => 299,
            'method' => 'bank_transfer',
            'status' => PaymentStatus::Completed->value,
        ])
        ->assertRedirect();

    expect(Payment::query()->count())->toBe(1)
        ->and($employer->fresh()->package?->value)->toBe($package->slug);

    $this->actingAs($admin)
        ->post(route('admin.notifications.store'), [
            'audience' => 'employers',
            'category' => 'System',
            'title' => 'Welcome',
            'message' => 'Your payment was recorded.',
        ])
        ->assertRedirect();

    Notification::assertSentTo($employer, PortalNotification::class);
});

test('employer can save a company profile and job seeker can save a profile', function () {
    $employer = User::factory()->employer()->create();
    $seeker = User::factory()->jobSeeker()->create();

    $this->actingAs($employer)
        ->put(route('employer.profile.update'), [
            'company_name' => 'Acme Gulf',
            'contact_name' => 'Sara',
            'industry' => 'Technology',
            'website' => 'https://acme.test',
            'about' => 'We hire talent.',
            'address' => 'Dubai',
            'phone' => '+971 4 000 0000',
            'email' => $employer->email,
        ])
        ->assertRedirect();

    expect($employer->fresh()->company_name)->toBe('Acme Gulf');

    $this->actingAs($seeker)
        ->put(route('job-seeker.profile.update'), [
            'name' => 'Ali Khan',
            'phone' => '+971 50 111 2222',
            'location' => 'Sharjah, UAE',
            'headline' => 'Frontend developer',
            'bio' => 'Builds interfaces.',
            'skills' => ['React', 'TypeScript'],
        ])
        ->assertRedirect();

    expect($seeker->fresh()->name)->toBe('Ali Khan')
        ->and($seeker->fresh()->jobSeekerProfile?->headline)->toBe('Frontend developer');
});
