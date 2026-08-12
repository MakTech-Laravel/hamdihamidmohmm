<?php

use App\Enums\RoleName;
use App\Enums\UserRole;
use App\Models\User;

test('admin login redirects to the shared login page', function () {
    $this->get(route('admin.login'))->assertRedirect(route('login'));
});

test('super admins are redirected to the admin dashboard after login', function () {
    $admin = User::factory()->superAdmin()->create();

    $this->post(route('login.store'), [
        'email' => $admin->email,
        'password' => 'password',
    ])->assertRedirect(route('admin.dashboard', absolute: false));
});

test('admins can access the admin dashboard through the shared login', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertOk();
});

test('job seekers cannot access admin routes', function () {
    $seeker = User::factory()->jobSeeker()->create();

    $this->actingAs($seeker)
        ->get(route('admin.dashboard'))
        ->assertRedirect(route('job-seeker.dashboard'));
});

test('guests are redirected to the shared login from admin routes', function () {
    $this->get(route('admin.dashboard'))
        ->assertRedirect(route('login'));
});

test('admins can logout through the shared logout route', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('logout'))
        ->assertRedirect('/');

    $this->assertGuest();
});

test('users receive the correct spatie roles', function () {
    $seeker = User::factory()->jobSeeker()->create();
    $employer = User::factory()->employer()->create();
    $admin = User::factory()->admin()->create();
    $superAdmin = User::factory()->superAdmin()->create();

    expect($seeker->hasRole(RoleName::JobSeeker->value))->toBeTrue()
        ->and($employer->hasRole(RoleName::Employer->value))->toBeTrue()
        ->and($admin->hasRole(RoleName::Admin->value))->toBeTrue()
        ->and($superAdmin->hasRole(RoleName::SuperAdmin->value))->toBeTrue()
        ->and($seeker->role)->toBe(UserRole::JobSeeker)
        ->and($employer->role)->toBe(UserRole::Employer);
});
