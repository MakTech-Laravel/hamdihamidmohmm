<?php

use App\Enums\RoleName;
use App\Enums\UserRole;
use App\Models\User;

test('super admins can view admin management', function () {
    $superAdmin = User::factory()->superAdmin()->create();

    $this->actingAs($superAdmin)
        ->get(route('admin.admins.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/Admin/AdminManagement')
            ->has('admins'));
});

test('regular admins cannot view admin management', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.admins.index'))
        ->assertRedirect(route('admin.dashboard'));
});

test('super admins can create admin accounts', function () {
    $superAdmin = User::factory()->superAdmin()->create();

    $this->actingAs($superAdmin)
        ->post(route('admin.admins.store'), [
            'name' => 'New Admin',
            'email' => 'new-admin@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])
        ->assertRedirect(route('admin.admins.index'));

    $admin = User::query()->where('email', 'new-admin@example.com')->first();

    expect($admin)->not->toBeNull()
        ->and($admin->role)->toBe(UserRole::Admin)
        ->and($admin->hasRole(RoleName::Admin->value))->toBeTrue()
        ->and($admin->canManageAdmins())->toBeFalse();
});

test('regular admins cannot create admin accounts', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.admins.store'), [
            'name' => 'Blocked Admin',
            'email' => 'blocked-admin@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])
        ->assertRedirect(route('admin.dashboard'));

    expect(User::query()->where('email', 'blocked-admin@example.com')->exists())->toBeFalse();
});
