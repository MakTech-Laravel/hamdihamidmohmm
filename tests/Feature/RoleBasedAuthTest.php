<?php

use App\Enums\UserRole;
use App\Models\User;

test('registration role selector can be rendered', function () {
    $this->get(route('register'))->assertOk();
});

test('job seeker registration screen can be rendered', function () {
    $this->get(route('register.role', ['role' => 'job-seeker']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('auth/register-form')
            ->where('role', UserRole::JobSeeker->value)
            ->where('isEmployer', false));
});

test('employer registration screen can be rendered', function () {
    $this->get(route('register.role', ['role' => 'employer']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('auth/register-form')
            ->where('role', UserRole::Employer->value)
            ->where('isEmployer', true));
});

test('job seekers can register and land on the job seeker profile', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Amina Seeker',
        'email' => 'seeker@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => UserRole::JobSeeker->value,
        'terms' => '1',
    ]);

    $this->assertAuthenticated();

    $user = User::query()->where('email', 'seeker@example.com')->first();

    expect($user)->not->toBeNull()
        ->and($user->role)->toBe(UserRole::JobSeeker)
        ->and($user->company_name)->toBeNull();

    $response->assertRedirect(route('job-seeker.profile', absolute: false));
});

test('employers can register and land on the employer dashboard', function () {
    $response = $this->post(route('register.store'), [
        'company_name' => 'Horizon Hiring Ltd',
        'email' => 'employer@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => UserRole::Employer->value,
        'terms' => '1',
    ]);

    $this->assertAuthenticated();

    $user = User::query()->where('email', 'employer@example.com')->first();

    expect($user)->not->toBeNull()
        ->and($user->role)->toBe(UserRole::Employer)
        ->and($user->company_name)->toBe('Horizon Hiring Ltd')
        ->and($user->name)->toBe('Horizon Hiring Ltd');

    $response->assertRedirect(route('employer.dashboard', absolute: false));
});

test('registration requires an accepted terms agreement', function () {
    $this->post(route('register.store'), [
        'name' => 'No Terms User',
        'email' => 'noterms@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => UserRole::JobSeeker->value,
    ])->assertSessionHasErrors('terms');

    $this->assertGuest();
});

test('job seekers are redirected to their profile after login', function () {
    $user = User::factory()->jobSeeker()->create();

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ])->assertRedirect(route('job-seeker.profile', absolute: false));
});

test('employers are redirected to their dashboard after login', function () {
    $user = User::factory()->employer()->create();

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ])->assertRedirect(route('employer.dashboard', absolute: false));
});

test('dashboard index redirects users to their role dashboard', function () {
    $seeker = User::factory()->jobSeeker()->create();
    $employer = User::factory()->employer()->create();

    $this->actingAs($seeker)
        ->get(route('dashboard'))
        ->assertRedirect(route('job-seeker.dashboard'));

    $this->actingAs($employer)
        ->get(route('dashboard'))
        ->assertRedirect(route('employer.dashboard'));
});

test('job seekers cannot access the employer dashboard', function () {
    $seeker = User::factory()->jobSeeker()->create();

    $this->actingAs($seeker)
        ->get(route('employer.dashboard'))
        ->assertRedirect(route('job-seeker.dashboard'));
});

test('employers cannot access the job seeker dashboard', function () {
    $employer = User::factory()->employer()->create();

    $this->actingAs($employer)
        ->get(route('job-seeker.dashboard'))
        ->assertRedirect(route('employer.dashboard'));
});
