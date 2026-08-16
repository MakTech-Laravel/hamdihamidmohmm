<?php

use App\Enums\ActivityAction;
use App\Enums\JobSeekerAccountStatus;
use App\Enums\JobSeekerResumeStatus;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('admins can view the job seeker management page', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->jobSeeker()->create(['name' => 'Ali Khan']);

    $this->actingAs($admin)
        ->get(route('admin.job-seekers.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/Admin/JobSeekerManagement')
            ->has('jobSeekers')
            ->has('stats')
            ->where('stats.total', 1));
});

test('admins can create a job seeker', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.job-seekers.store'), [
            'name' => 'Rania Ahmed',
            'email' => 'rania@email.com',
            'phone' => '+971 50 111 2222',
            'location' => 'Dubai, UAE',
            'resume_status' => JobSeekerResumeStatus::Active->value,
            'account_status' => JobSeekerAccountStatus::Active->value,
            'password' => 'password',
            'password_confirmation' => 'password',
        ])
        ->assertRedirect();

    $seeker = User::query()->where('email', 'rania@email.com')->first();

    expect($seeker)->not->toBeNull()
        ->and($seeker->isJobSeeker())->toBeTrue()
        ->and($seeker->name)->toBe('Rania Ahmed')
        ->and($seeker->location)->toBe('Dubai, UAE')
        ->and($seeker->account_status)->toBe(JobSeekerAccountStatus::Active);
});

test('admins can view and edit a job seeker', function () {
    $admin = User::factory()->admin()->create();
    $seeker = User::factory()->jobSeeker()->create([
        'name' => 'Hassan Farid',
        'location' => 'Dubai, UAE',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.job-seekers.show', $seeker))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/Admin/JobSeekerShow')
            ->where('jobSeeker.name', 'Hassan Farid'));

    $this->actingAs($admin)
        ->put(route('admin.job-seekers.update', $seeker), [
            'name' => 'Hassan Farid Ali',
            'email' => $seeker->email,
            'phone' => '+971 50 222 3333',
            'location' => 'Abu Dhabi, UAE',
            'resume_status' => JobSeekerResumeStatus::Warning->value,
            'account_status' => JobSeekerAccountStatus::Inactive->value,
        ])
        ->assertRedirect(route('admin.job-seekers.show', $seeker));

    expect($seeker->fresh()->name)->toBe('Hassan Farid Ali')
        ->and($seeker->fresh()->location)->toBe('Abu Dhabi, UAE')
        ->and($seeker->fresh()->account_status)->toBe(JobSeekerAccountStatus::Inactive)
        ->and($seeker->fresh()->resume_status)->toBe(JobSeekerResumeStatus::Warning);
});

test('admins can suspend a job seeker', function () {
    $admin = User::factory()->admin()->create();
    $seeker = User::factory()->jobSeeker()->create();

    $this->actingAs($admin)
        ->post(route('admin.job-seekers.suspend', $seeker))
        ->assertRedirect();

    expect($seeker->fresh()->account_status)->toBe(JobSeekerAccountStatus::Suspended)
        ->and(ActivityLog::query()
            ->where('user_id', $seeker->id)
            ->where('action', ActivityAction::JobSeekerSuspended)
            ->exists())->toBeTrue();
});

test('admins can reactivate a suspended job seeker', function () {
    $admin = User::factory()->admin()->create();
    $seeker = User::factory()->jobSeeker()->create([
        'account_status' => JobSeekerAccountStatus::Suspended,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.job-seekers.reactivate', $seeker))
        ->assertRedirect();

    expect($seeker->fresh()->account_status)->toBe(JobSeekerAccountStatus::Active)
        ->and(ActivityLog::query()
            ->where('user_id', $seeker->id)
            ->where('action', ActivityAction::JobSeekerReactivated)
            ->exists())->toBeTrue();
});

test('admins cannot reactivate an active job seeker', function () {
    $admin = User::factory()->admin()->create();
    $seeker = User::factory()->jobSeeker()->create();

    $this->actingAs($admin)
        ->post(route('admin.job-seekers.reactivate', $seeker))
        ->assertForbidden();
});

test('admins can export job seekers as csv', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->jobSeeker()->create(['name' => 'Mariam Hassan']);

    $response = $this->actingAs($admin)
        ->get(route('admin.job-seekers.export'));

    $response->assertOk()
        ->assertHeader('content-type', 'text/csv; charset=UTF-8');

    expect($response->streamedContent())->toContain('Mariam Hassan');
});

test('job seekers cannot manage job seekers', function () {
    $seeker = User::factory()->jobSeeker()->create();
    $other = User::factory()->jobSeeker()->create();

    $this->actingAs($seeker)
        ->get(route('admin.job-seekers.index'))
        ->assertRedirect(route('job-seeker.dashboard'));

    $this->actingAs($seeker)
        ->get(route('admin.job-seekers.show', $other))
        ->assertRedirect(route('job-seeker.dashboard'));
});

test('admins cannot open an employer as a job seeker', function () {
    $admin = User::factory()->admin()->create();
    $employer = User::factory()->employer()->create();

    $this->actingAs($admin)
        ->get(route('admin.job-seekers.show', $employer))
        ->assertNotFound();
});

test('admins can reset a job seeker password', function () {
    $admin = User::factory()->admin()->create();
    $seeker = User::factory()->jobSeeker()->create();

    $this->actingAs($admin)
        ->put(route('admin.job-seekers.update', $seeker), [
            'name' => $seeker->name,
            'email' => $seeker->email,
            'phone' => $seeker->phone,
            'location' => $seeker->location,
            'resume_status' => $seeker->resume_status?->value,
            'account_status' => $seeker->account_status?->value,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])
        ->assertRedirect();

    expect(Hash::check('new-password', $seeker->fresh()->password))->toBeTrue();
});
