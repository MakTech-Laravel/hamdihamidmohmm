<?php

use App\Enums\EmployerVerificationStatus;
use App\Enums\JobApplicationStatus;
use App\Enums\JobPostStatus;
use App\Enums\PaymentStatus;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\Package;
use App\Models\Payment;
use App\Models\User;
use App\Notifications\PortalNotification;
use App\Support\PortalPreferences;
use Illuminate\Support\Facades\Notification;

test('applying to a job notifies the employer when preference is enabled', function () {
    Notification::fake();

    $employer = User::factory()->employer()->create();
    $seeker = User::factory()->jobSeeker()->create(['name' => 'Ali Seeker']);
    $job = JobPost::factory()->for($employer, 'employer')->create([
        'status' => JobPostStatus::Active,
        'title' => 'Frontend Engineer',
    ]);

    $this->actingAs($seeker)
        ->post(route('jobs.apply', $job), [
            'cover_letter' => 'I am interested.',
        ])
        ->assertRedirect();

    Notification::assertSentTo($employer, PortalNotification::class, function (PortalNotification $notification) {
        return $notification->category === 'Application'
            && str_contains($notification->message, 'Frontend Engineer');
    });
});

test('applying to a job skips employer notification when preference is disabled', function () {
    Notification::fake();

    $employer = User::factory()->employer()->create([
        'portal_preferences' => PortalPreferences::mergeNotifications(
            User::factory()->employer()->make(),
            [
                'new_applications' => false,
                'job_expiry' => true,
                'billing_alerts' => true,
                'system_updates' => false,
                'weekly_report' => true,
            ],
        ),
    ]);
    $seeker = User::factory()->jobSeeker()->create();
    $job = JobPost::factory()->for($employer, 'employer')->create([
        'status' => JobPostStatus::Active,
    ]);

    $this->actingAs($seeker)
        ->post(route('jobs.apply', $job), [
            'cover_letter' => 'Hello',
        ])
        ->assertRedirect();

    Notification::assertNotSentTo($employer, PortalNotification::class);
});

test('employer status updates notify the job seeker', function () {
    Notification::fake();

    $employer = User::factory()->employer()->create();
    $seeker = User::factory()->jobSeeker()->create();
    $job = JobPost::factory()->for($employer, 'employer')->create([
        'title' => 'Backend Developer',
        'status' => JobPostStatus::Active,
    ]);
    $application = JobApplication::factory()->create([
        'job_post_id' => $job->id,
        'job_seeker_id' => $seeker->id,
        'status' => JobApplicationStatus::Applied,
    ]);

    $this->actingAs($employer)
        ->put(route('employer.applications.update', $application), [
            'status' => JobApplicationStatus::Interview->value,
        ])
        ->assertRedirect();

    Notification::assertSentTo($seeker, PortalNotification::class, function (PortalNotification $notification) {
        return $notification->category === 'Application'
            && str_contains($notification->message, 'Interview');
    });
});

test('verification approval notifies the employer', function () {
    Notification::fake();

    $admin = User::factory()->admin()->create();
    $employer = User::factory()->employer()->create([
        'verification_status' => EmployerVerificationStatus::Pending,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.employers.approve', $employer))
        ->assertRedirect();

    Notification::assertSentTo($employer, PortalNotification::class, function (PortalNotification $notification) {
        return $notification->category === 'Verification';
    });
});

test('payment approval notifies the employer when billing alerts are enabled', function () {
    Notification::fake();

    $admin = User::factory()->admin()->create();
    $employer = User::factory()->employer()->create();
    $package = Package::factory()->create([
        'name' => 'Business',
        'slug' => 'premium',
    ]);
    $payment = Payment::factory()->create([
        'employer_id' => $employer->id,
        'package_id' => $package->id,
        'status' => PaymentStatus::Pending,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.payments.approve', $payment))
        ->assertRedirect();

    Notification::assertSentTo($employer, PortalNotification::class, function (PortalNotification $notification) {
        return $notification->category === 'Billing';
    });
});

test('public job salary respects employer privacy preference', function () {
    $employer = User::factory()->employer()->create([
        'portal_preferences' => [
            'privacy' => [
                'profile_visibility' => 'public',
                'show_salary' => false,
                'show_contact_email' => false,
            ],
        ],
    ]);
    $job = JobPost::factory()->for($employer, 'employer')->create([
        'status' => JobPostStatus::Active,
        'salary_range' => 'SAR 10,000',
        'slug' => 'privacy-salary-job',
    ]);

    $this->get(route('jobs.show', $job->slug))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('frontend/job-show')
            ->where('job.salary', null));
});
