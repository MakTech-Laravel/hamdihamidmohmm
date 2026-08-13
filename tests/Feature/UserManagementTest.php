<?php

use App\Enums\ActivityAction;
use App\Enums\RoleName;
use App\Enums\UserRole;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('admins can view all users page', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.users.index'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/Admin/UserManagement')
            ->has('users')
            ->has('roles')
            ->missing('permissionMatrix'));
});

test('admins can view a user details page', function () {
    $admin = User::factory()->admin()->create();
    $seeker = User::factory()->jobSeeker()->create([
        'name' => 'Noura Al-Farsi',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.users.show', $seeker))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/Admin/UserShow')
            ->where('managedUser.name', 'Noura Al-Farsi')
            ->where('managedUser.email', $seeker->email)
            ->has('activities')
            ->missing('roles'));
});

test('admins can open a user edit page', function () {
    $admin = User::factory()->admin()->create();
    $seeker = User::factory()->jobSeeker()->create([
        'name' => 'Noura Al-Farsi',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.users.edit', $seeker))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/Admin/UserEdit')
            ->where('managedUser.name', 'Noura Al-Farsi')
            ->has('roles'));
});

test('admins cannot open the edit page for a super admin', function () {
    $admin = User::factory()->admin()->create();
    $superAdmin = User::factory()->superAdmin()->create();

    $this->actingAs($admin)
        ->get(route('admin.users.edit', $superAdmin))
        ->assertForbidden();
});

test('admins can update user information', function () {
    $admin = User::factory()->admin()->create();
    $seeker = User::factory()->jobSeeker()->create();

    $this->actingAs($admin)
        ->put(route('admin.users.update', $seeker), [
            'name' => 'Updated Seeker',
            'email' => 'updated-seeker@example.com',
            'company_name' => 'Al Noor Talent',
            'role' => RoleName::JobSeeker->value,
        ])
        ->assertRedirect(route('admin.users.show', $seeker));

    $seeker->refresh();

    expect($seeker->name)->toBe('Updated Seeker')
        ->and($seeker->email)->toBe('updated-seeker@example.com')
        ->and($seeker->company_name)->toBe('Al Noor Talent')
        ->and(ActivityLog::query()
            ->where('user_id', $seeker->id)
            ->where('action', ActivityAction::ProfileUpdated)
            ->exists())->toBeTrue();
});

test('admins can reset a user password', function () {
    $admin = User::factory()->admin()->create();
    $seeker = User::factory()->jobSeeker()->create();

    $this->actingAs($admin)
        ->put(route('admin.users.update', $seeker), [
            'name' => $seeker->name,
            'email' => $seeker->email,
            'role' => RoleName::JobSeeker->value,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])
        ->assertRedirect(route('admin.users.show', $seeker));

    expect(Hash::check('new-password', $seeker->fresh()->password))->toBeTrue()
        ->and(ActivityLog::query()
            ->where('user_id', $seeker->id)
            ->where('action', ActivityAction::PasswordUpdated)
            ->exists())->toBeTrue();
});

test('admins can assign a user role from edit', function () {
    $admin = User::factory()->admin()->create();
    $seeker = User::factory()->jobSeeker()->create();

    $this->actingAs($admin)
        ->put(route('admin.users.update', $seeker), [
            'name' => $seeker->name,
            'email' => $seeker->email,
            'role' => RoleName::Employer->value,
        ])
        ->assertRedirect(route('admin.users.show', $seeker));

    expect($seeker->fresh()->role)->toBe(UserRole::Employer)
        ->and($seeker->fresh()->hasRole(RoleName::Employer->value))->toBeTrue()
        ->and(ActivityLog::query()
            ->where('user_id', $seeker->id)
            ->where('action', ActivityAction::RoleUpdated)
            ->exists())->toBeTrue();
});

test('admins cannot change their own role', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->put(route('admin.users.update', $admin), [
            'name' => $admin->name,
            'email' => $admin->email,
            'role' => RoleName::JobSeeker->value,
        ])
        ->assertForbidden();
});

test('admins cannot update a super admin', function () {
    $admin = User::factory()->admin()->create();
    $superAdmin = User::factory()->superAdmin()->create();

    $this->actingAs($admin)
        ->put(route('admin.users.update', $superAdmin), [
            'name' => 'Hacked Super Admin',
            'email' => $superAdmin->email,
            'role' => RoleName::Admin->value,
        ])
        ->assertForbidden();
});

test('user logins are tracked', function () {
    $seeker = User::factory()->jobSeeker()->create();

    $this->post(route('login.store'), [
        'email' => $seeker->email,
        'password' => 'password',
    ])->assertRedirect();

    expect(ActivityLog::query()
        ->where('user_id', $seeker->id)
        ->where('action', ActivityAction::LoggedIn)
        ->exists())->toBeTrue();
});

test('job seekers cannot view user management details', function () {
    $seeker = User::factory()->jobSeeker()->create();
    $other = User::factory()->employer()->create();

    $this->actingAs($seeker)
        ->get(route('admin.users.show', $other))
        ->assertRedirect(route('job-seeker.dashboard'));
});
