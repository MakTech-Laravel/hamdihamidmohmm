<?php

use App\Enums\ActivityAction;
use App\Enums\EmployerAccountStatus;
use App\Enums\EmployerVerificationStatus;
use App\Enums\UserRole;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('admins can delete an employer account and free the email for re-registration', function () {
    $admin = User::factory()->admin()->create();
    $employer = User::factory()->employer()->create([
        'email' => 'reuse-employer@example.com',
        'phone' => '+249900000001',
    ]);

    $this->actingAs($admin)
        ->delete(route('admin.employers.destroy', $employer))
        ->assertRedirect(route('admin.employers.index'));

    expect(User::query()->where('email', 'reuse-employer@example.com')->exists())->toBeFalse()
        ->and(User::withTrashed()->find($employer->id)?->trashed())->toBeTrue();

    $this->post(route('logout'));

    $this->post(route('register.store'), [
        'company_name' => 'Rebuilt Co',
        'email' => 'reuse-employer@example.com',
        'phone' => '+249900000099',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => UserRole::Employer->value,
        'terms' => '1',
    ])->assertRedirect();

    expect(User::query()->where('email', 'reuse-employer@example.com')->exists())->toBeTrue();
});

test('rejected employers can re-register with the same email', function () {
    $admin = User::factory()->admin()->create();
    $employer = User::factory()->pendingEmployer()->create([
        'email' => 'rejected-employer@example.com',
        'phone' => '+249900000002',
    ]);

    $this->actingAs($admin)
        ->post(route('admin.employers.reject', $employer), [
            'rejection_reason' => 'Incomplete documents.',
        ])
        ->assertRedirect();

    $employer->refresh();

    expect($employer->verification_status)->toBe(EmployerVerificationStatus::Rejected)
        ->and($employer->account_status)->toBe(EmployerAccountStatus::Rejected)
        ->and($employer->original_email)->toBe('rejected-employer@example.com')
        ->and($employer->email)->not->toBe('rejected-employer@example.com');

    $this->post(route('logout'));

    $this->post(route('register.store'), [
        'company_name' => 'Fresh Employer Co',
        'email' => 'rejected-employer@example.com',
        'phone' => '+249900000088',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => UserRole::Employer->value,
        'terms' => '1',
    ])->assertRedirect();

    expect(User::query()->where('email', 'rejected-employer@example.com')->count())->toBe(1);
});

test('admins can delete a job seeker account and free the email', function () {
    $admin = User::factory()->admin()->create();
    $seeker = User::factory()->jobSeeker()->create([
        'email' => 'reuse-seeker@example.com',
        'phone' => '+249900000003',
    ]);

    $this->actingAs($admin)
        ->delete(route('admin.job-seekers.destroy', $seeker))
        ->assertRedirect(route('admin.job-seekers.index'));

    $this->post(route('logout'));

    $this->post(route('register.store'), [
        'name' => 'Returning Seeker',
        'email' => 'reuse-seeker@example.com',
        'phone' => '+249900000077',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => UserRole::JobSeeker->value,
        'terms' => '1',
    ])->assertRedirect();

    expect(User::query()->where('email', 'reuse-seeker@example.com')->exists())->toBeTrue();
});

test('admins can reset employer and job seeker passwords', function () {
    $admin = User::factory()->admin()->create();
    $employer = User::factory()->employer()->create();
    $seeker = User::factory()->jobSeeker()->create();

    $this->actingAs($admin)
        ->post(route('admin.employers.reset-password', $employer), [
            'password' => 'NewSecurePass1!',
            'password_confirmation' => 'NewSecurePass1!',
        ])
        ->assertRedirect();

    expect(Hash::check('NewSecurePass1!', $employer->fresh()->password))->toBeTrue()
        ->and(ActivityLog::query()
            ->where('user_id', $employer->id)
            ->where('action', ActivityAction::PasswordUpdated)
            ->exists())->toBeTrue();

    $this->actingAs($admin)
        ->post(route('admin.job-seekers.reset-password', $seeker), [
            'password' => 'NewSecurePass2!',
            'password_confirmation' => 'NewSecurePass2!',
        ])
        ->assertRedirect();

    expect(Hash::check('NewSecurePass2!', $seeker->fresh()->password))->toBeTrue();
});

test('registration requires a phone number and stores it', function () {
    $this->post(route('register.store'), [
        'name' => 'Phone Seeker',
        'email' => 'phone-seeker@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => UserRole::JobSeeker->value,
        'terms' => '1',
    ])->assertSessionHasErrors('phone');

    $this->post(route('register.store'), [
        'name' => 'Phone Seeker',
        'email' => 'phone-seeker@example.com',
        'phone' => '+249911223344',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => UserRole::JobSeeker->value,
        'terms' => '1',
    ])->assertRedirect();

    expect(User::query()->where('email', 'phone-seeker@example.com')->value('phone'))
        ->toBe('+249911223344');
});

test('admin employer details expose phone numbers', function () {
    $admin = User::factory()->admin()->create();
    $employer = User::factory()->employer()->create([
        'phone' => '+249955667788',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.employers.show', $employer))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/Admin/EmployerShow')
            ->where('employer.phone', '+249955667788'));
});
