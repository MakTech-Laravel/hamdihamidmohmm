<?php

use App\Enums\ActivityAction;
use App\Enums\EmployerAccountStatus;
use App\Enums\EmployerPackage;
use App\Enums\EmployerVerificationStatus;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('admins can view the employer management page', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->employer()->create(['company_name' => 'Gulf Construction Co.']);

    $this->actingAs($admin)
        ->get(route('admin.employers.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/Admin/EmployerManagement')
            ->has('employers')
            ->has('stats')
            ->where('stats.total', 1));
});

test('admins can create an employer', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.employers.store'), [
            'company_name' => 'Emirates Tech Solutions',
            'contact_name' => 'Omar Hassan',
            'email' => 'omar@emiratestech.ae',
            'industry' => 'Technology',
            'package' => EmployerPackage::Enterprise->value,
            'account_status' => EmployerAccountStatus::PendingVerification->value,
            'password' => 'password',
            'password_confirmation' => 'password',
        ])
        ->assertRedirect();

    $employer = User::query()->where('email', 'omar@emiratestech.ae')->first();

    expect($employer)->not->toBeNull()
        ->and($employer->isEmployer())->toBeTrue()
        ->and($employer->company_name)->toBe('Emirates Tech Solutions')
        ->and($employer->verification_status)->toBe(EmployerVerificationStatus::Pending);
});

test('admins can view and edit an employer', function () {
    $admin = User::factory()->admin()->create();
    $employer = User::factory()->employer()->create([
        'company_name' => 'Desert Finance Group',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.employers.show', $employer))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/Admin/EmployerShow')
            ->where('employer.company_name', 'Desert Finance Group'));

    $this->actingAs($admin)
        ->put(route('admin.employers.update', $employer), [
            'company_name' => 'Desert Finance Group LLC',
            'contact_name' => 'Khalid Nasser',
            'email' => $employer->email,
            'industry' => 'Finance',
            'package' => EmployerPackage::Premium->value,
            'account_status' => EmployerAccountStatus::Active->value,
        ])
        ->assertRedirect(route('admin.employers.show', $employer));

    expect($employer->fresh()->company_name)->toBe('Desert Finance Group LLC')
        ->and($employer->fresh()->package)->toBe(EmployerPackage::Premium);
});

test('admins can approve a pending employer', function () {
    $admin = User::factory()->admin()->create();
    $employer = User::factory()->pendingEmployer()->create();

    $this->actingAs($admin)
        ->post(route('admin.employers.approve', $employer))
        ->assertRedirect();

    expect($employer->fresh()->verification_status)->toBe(EmployerVerificationStatus::Approved)
        ->and($employer->fresh()->account_status)->toBe(EmployerAccountStatus::Active)
        ->and(ActivityLog::query()
            ->where('user_id', $employer->id)
            ->where('action', ActivityAction::EmployerApproved)
            ->exists())->toBeTrue();
});

test('admins can reject a pending employer with a reason', function () {
    $admin = User::factory()->admin()->create();
    $employer = User::factory()->pendingEmployer()->create([
        'email' => 'reject-me@example.com',
    ]);

    $this->actingAs($admin)
        ->post(route('admin.employers.reject', $employer), [
            'rejection_reason' => 'Incomplete trade license.',
        ])
        ->assertRedirect();

    $employer->refresh();

    expect($employer->verification_status)->toBe(EmployerVerificationStatus::Rejected)
        ->and($employer->account_status)->toBe(EmployerAccountStatus::Rejected)
        ->and($employer->rejection_reason)->toBe('Incomplete trade license.')
        ->and($employer->original_email)->toBe('reject-me@example.com')
        ->and($employer->email)->not->toBe('reject-me@example.com');
});

test('admins cannot approve an already active employer', function () {
    $admin = User::factory()->admin()->create();
    $employer = User::factory()->employer()->create();

    $this->actingAs($admin)
        ->post(route('admin.employers.approve', $employer))
        ->assertForbidden();
});

test('admins can export employers as csv', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->employer()->create(['company_name' => 'Apex Logistics']);

    $response = $this->actingAs($admin)
        ->get(route('admin.employers.export'));

    $response->assertOk()
        ->assertHeader('content-type', 'text/csv; charset=UTF-8');

    expect($response->streamedContent())->toContain('Apex Logistics');
});

test('job seekers cannot manage employers', function () {
    $seeker = User::factory()->jobSeeker()->create();
    $employer = User::factory()->employer()->create();

    $this->actingAs($seeker)
        ->get(route('admin.employers.index'))
        ->assertRedirect(route('job-seeker.dashboard'));

    $this->actingAs($seeker)
        ->get(route('admin.employers.show', $employer))
        ->assertRedirect(route('job-seeker.dashboard'));
});

test('admins cannot open a job seeker as an employer', function () {
    $admin = User::factory()->admin()->create();
    $seeker = User::factory()->jobSeeker()->create();

    $this->actingAs($admin)
        ->get(route('admin.employers.show', $seeker))
        ->assertNotFound();
});

test('admins can reset an employer password', function () {
    $admin = User::factory()->admin()->create();
    $employer = User::factory()->employer()->create();

    $this->actingAs($admin)
        ->put(route('admin.employers.update', $employer), [
            'company_name' => $employer->company_name,
            'contact_name' => $employer->contact_name ?? $employer->name,
            'email' => $employer->email,
            'industry' => $employer->industry,
            'package' => $employer->package?->value,
            'account_status' => $employer->account_status?->value,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])
        ->assertRedirect();

    expect(Hash::check('new-password', $employer->fresh()->password))->toBeTrue();
});
