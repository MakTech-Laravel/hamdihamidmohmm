<?php

use App\Enums\EmployerAccountStatus;
use App\Enums\EmployerVerificationStatus;
use App\Enums\UserRole;
use App\Models\User;
use App\Notifications\PortalNotification;
use Illuminate\Support\Facades\Notification;

test('employer registration stays pending, logs out, and notifies admins', function () {
    Notification::fake();

    $admin = User::factory()->admin()->create();

    $this->post(route('register.store'), [
        'company_name' => 'Pending Co Ltd',
        'email' => 'pending-employer@example.com',
        'phone' => '+249900000014',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => UserRole::Employer->value,
        'terms' => '1',
    ])
        ->assertRedirect(route('login'))
        ->assertSessionHas('status');

    $this->assertGuest();

    $employer = User::query()->where('email', 'pending-employer@example.com')->first();

    expect($employer)->not->toBeNull()
        ->and($employer?->verification_status)->toBe(EmployerVerificationStatus::Pending)
        ->and($employer?->account_status)->toBe(EmployerAccountStatus::PendingVerification);

    Notification::assertSentTo($admin, PortalNotification::class, function (PortalNotification $notification) {
        return $notification->category === 'Verification'
            && str_contains($notification->title, 'New employer registration');
    });
});

test('pending employers cannot sign in until approved', function () {
    $employer = User::factory()->pendingEmployer()->create([
        'email' => 'waiting@example.com',
    ]);

    $this->post(route('login.store'), [
        'email' => $employer->email,
        'password' => 'password',
    ])->assertSessionHasErrors('email');

    $this->assertGuest();
});

test('approved employers can sign in after admin approval', function () {
    $admin = User::factory()->admin()->create();
    $employer = User::factory()->pendingEmployer()->create([
        'email' => 'approve-me@example.com',
    ]);

    $this->actingAs($admin)
        ->post(route('admin.employers.approve', $employer))
        ->assertRedirect();

    $this->post(route('logout'));

    $this->post(route('login.store'), [
        'email' => $employer->email,
        'password' => 'password',
    ])->assertRedirect(route('employer.dashboard', absolute: false));

    $this->assertAuthenticatedAs($employer->fresh());
});

test('job seeker registration is unaffected by employer approval flow', function () {
    $this->post(route('register.store'), [
        'name' => 'Free Seeker',
        'email' => 'free-seeker@example.com',
        'phone' => '+249900000015',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => UserRole::JobSeeker->value,
        'terms' => '1',
    ])->assertRedirect(route('job-seeker.profile', absolute: false));

    $this->assertAuthenticated();
});
