<?php

use App\Models\Admin;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

function createAdmin(): Admin
{
    return Admin::create([
        'name' => 'Admin User',
        'email' => 'admin@dev.com',
        'password' => Hash::make('admin@dev.com'),
    ]);
}

test('admin login screen can be rendered', function () {
    $this->get(route('admin.login'))->assertOk();
});

test('admins can authenticate using the admin login screen', function () {
    $admin = createAdmin();

    $response = $this->post(route('admin.login.store'), [
        'email' => 'admin@dev.com',
        'password' => 'admin@dev.com',
    ]);

    $this->assertAuthenticatedAs($admin, 'admin');
    $response->assertRedirect(route('admin.dashboard'));
});

test('admins cannot authenticate with invalid password', function () {
    createAdmin();

    $this->post(route('admin.login.store'), [
        'email' => 'admin@dev.com',
        'password' => 'wrong-password',
    ]);

    $this->assertGuest('admin');
});

test('regular users cannot access admin routes', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('admin.dashboard'))
        ->assertRedirect(route('admin.login'));
});

test('authenticated admins can access admin dashboard', function () {
    $admin = createAdmin();

    $this->actingAs($admin, 'admin')
        ->get(route('admin.dashboard'))
        ->assertOk();
});

test('guests are redirected to admin login from admin routes', function () {
    $this->get(route('admin.dashboard'))
        ->assertRedirect(route('admin.login'));
});

test('admins can logout', function () {
    $admin = createAdmin();

    $this->actingAs($admin, 'admin')
        ->post(route('admin.logout'))
        ->assertRedirect(route('admin.login'));

    $this->assertGuest('admin');
});
