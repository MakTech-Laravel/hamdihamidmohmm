<?php

use App\Enums\Gender;
use App\Enums\UserRole;
use App\Models\User;

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('new users can register', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'phone' => '+249900000010',
        'gender' => Gender::Male->value,
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => UserRole::JobSeeker->value,
        'terms' => '1',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('job-seeker.profile', absolute: false));

    $user = User::query()->where('email', 'test@example.com')->first();

    expect($user)->not->toBeNull()
        ->and($user?->jobSeekerProfile?->gender)->toBe(Gender::Male);
});

test('job seeker registration requires gender', function () {
    $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'nogender@example.com',
        'phone' => '+249900000011',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => UserRole::JobSeeker->value,
        'terms' => '1',
    ])->assertSessionHasErrors('gender');
});
