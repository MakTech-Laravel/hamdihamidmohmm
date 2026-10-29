<?php

use App\Enums\JobPostStatus;
use App\Enums\JobTaxonomyType;
use App\Models\JobAlert;
use App\Models\JobPost;
use App\Models\JobTaxonomy;
use App\Models\User;
use App\Notifications\JobAlertMatchedNotification;
use App\Support\PortalPreferences;
use Illuminate\Support\Facades\Notification;

test('job seekers can manage job alerts', function () {
    $seeker = User::factory()->jobSeeker()->create();
    $country = JobTaxonomy::factory()->create([
        'type' => JobTaxonomyType::Country,
        'name' => 'Sudan',
        'slug' => 'sudan',
        'is_active' => true,
    ]);

    $this->actingAs($seeker)
        ->post(route('job-seeker.alerts.store'), [
            'name' => 'IT Systems',
            'keyword' => 'System Administrator',
            'country' => $country->slug,
            'is_active' => true,
        ])
        ->assertRedirect(route('job-seeker.alerts.index'));

    $alert = JobAlert::query()->sole();

    expect($alert->user_id)->toBe($seeker->id)
        ->and($alert->keyword)->toBe('System Administrator')
        ->and($alert->country)->toBe('sudan')
        ->and($alert->is_active)->toBeTrue();

    $this->actingAs($seeker)
        ->put(route('job-seeker.alerts.update', $alert), [
            'name' => 'IT Systems',
            'keyword' => 'Network Administrator',
            'country' => $country->slug,
            'is_active' => false,
        ])
        ->assertRedirect(route('job-seeker.alerts.index'));

    expect($alert->fresh()->keyword)->toBe('Network Administrator')
        ->and($alert->fresh()->is_active)->toBeFalse();

    $this->actingAs($seeker)
        ->get(route('job-seeker.alerts.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/User/JobSeekerJobAlerts')
            ->has('alerts.data', 1)
            ->where('alerts.data.0.display_name', 'IT Systems'));

    $this->actingAs($seeker)
        ->delete(route('job-seeker.alerts.destroy', $alert))
        ->assertRedirect(route('job-seeker.alerts.index'));

    expect(JobAlert::query()->count())->toBe(0);
});

test('job alerts require at least one criterion', function () {
    $seeker = User::factory()->jobSeeker()->create();

    $this->actingAs($seeker)
        ->post(route('job-seeker.alerts.store'), [
            'name' => 'Empty alert',
        ])
        ->assertSessionHasErrors('keyword');
});

test('job seekers are notified when a matching job becomes active', function () {
    Notification::fake();

    $seeker = User::factory()->jobSeeker()->create();
    $employer = User::factory()->employer()->create([
        'company_name' => 'Oasis Retail Group',
    ]);

    JobAlert::factory()->create([
        'user_id' => $seeker->id,
        'name' => 'IT System Administrator',
        'keyword' => 'System Administrator',
        'is_active' => true,
    ]);

    $job = JobPost::factory()->create([
        'employer_id' => $employer->id,
        'title' => 'IT System Administrator',
        'status' => JobPostStatus::Pending,
    ]);

    $job->activateFromReview();

    Notification::assertSentTo(
        $seeker,
        JobAlertMatchedNotification::class,
        function (JobAlertMatchedNotification $notification) use ($job): bool {
            return $notification->jobTitle === 'IT System Administrator'
                && $notification->companyName === 'Oasis Retail Group'
                && $notification->jobSlug === $job->slug
                && $notification->alertName === 'IT System Administrator';
        },
    );

    expect(JobAlert::query()->sole()->matchedJobs()->whereKey($job->id)->exists())->toBeTrue();
});

test('matching jobs are not notified twice', function () {
    Notification::fake();

    $seeker = User::factory()->jobSeeker()->create();
    JobAlert::factory()->create([
        'user_id' => $seeker->id,
        'keyword' => 'Finance Officer',
    ]);

    $job = JobPost::factory()->create([
        'title' => 'Finance Officer',
        'status' => JobPostStatus::Pending,
    ]);

    $job->activateFromReview();
    $job->forceFill(['status' => JobPostStatus::Draft])->save();
    $job->activateFromReview();

    Notification::assertSentToTimes($seeker, JobAlertMatchedNotification::class, 1);
});

test('inactive alerts and disabled recommendation preferences do not email seekers', function () {
    Notification::fake();

    $inactiveSeeker = User::factory()->jobSeeker()->create();
    JobAlert::factory()->inactive()->create([
        'user_id' => $inactiveSeeker->id,
        'keyword' => 'Nurse',
    ]);

    $mutedSeeker = User::factory()->jobSeeker()->create();
    $mutedSeeker->forceFill([
        'portal_preferences' => PortalPreferences::mergeEmailPreferences(
            $mutedSeeker,
            ['job_recommendations' => false],
        ),
    ])->save();
    JobAlert::factory()->create([
        'user_id' => $mutedSeeker->id,
        'keyword' => 'Nurse',
    ]);

    $job = JobPost::factory()->create([
        'title' => 'Registered Nurse',
        'status' => JobPostStatus::Pending,
    ]);

    $job->activateFromReview();

    Notification::assertNotSentTo($inactiveSeeker, JobAlertMatchedNotification::class);
    Notification::assertNotSentTo($mutedSeeker, JobAlertMatchedNotification::class);
});

test('other seekers cannot update someone else alerts', function () {
    $owner = User::factory()->jobSeeker()->create();
    $other = User::factory()->jobSeeker()->create();
    $alert = JobAlert::factory()->create([
        'user_id' => $owner->id,
        'keyword' => 'Teacher',
    ]);

    $this->actingAs($other)
        ->put(route('job-seeker.alerts.update', $alert), [
            'keyword' => 'Hacked',
        ])
        ->assertForbidden();
});

test('job alerts are paginated at the default page size', function () {
    $seeker = User::factory()->jobSeeker()->create();
    JobAlert::factory()->count(31)->create(['user_id' => $seeker->id]);
    JobAlert::factory()->create();

    $this->actingAs($seeker)
        ->get(route('job-seeker.alerts.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('alerts.data', 30)
            ->where('alerts.total', 31)
            ->where('alerts.per_page', 30));

    $this->actingAs($seeker)
        ->get(route('job-seeker.alerts.index', ['page' => 2]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('alerts.data', 1));
});
