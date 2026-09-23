<?php

use App\Enums\UserRole;

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('new users can register', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'phone' => '+249900000010',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => UserRole::JobSeeker->value,
        'terms' => '1',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('job-seeker.profile', absolute: false));
});
