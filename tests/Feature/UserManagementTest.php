<?php

use App\Enums\RoleName;
use App\Enums\UserRole;
use App\Models\User;

test('admins can view all users page', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.users.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/Admin/UserManagement')
            ->has('users')
            ->has('roles')
            ->missing('permissionMatrix'));
});

test('admins can update a user role', function () {
    $admin = User::factory()->admin()->create();
    $seeker = User::factory()->jobSeeker()->create();

    $this->actingAs($admin)
        ->put(route('admin.users.role.update', $seeker), [
            'role' => UserRole::Employer->value,
        ])
        ->assertRedirect();

    expect($seeker->fresh()->role)->toBe(UserRole::Employer)
        ->and($seeker->fresh()->hasRole(RoleName::Employer->value))->toBeTrue();
});
