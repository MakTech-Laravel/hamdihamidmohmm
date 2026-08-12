<?php

use App\Enums\PermissionName;
use App\Enums\RoleName;
use App\Models\User;
use Spatie\Permission\Models\Role;

test('admins can view roles and permissions page', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.roles-permissions.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/Admin/RolePermissions')
            ->has('roles')
            ->has('permissionMatrix')
            ->has('allPermissions'));
});

test('super admins can update admin role permissions', function () {
    $superAdmin = User::factory()->superAdmin()->create();

    $this->actingAs($superAdmin)
        ->put(route('admin.roles.permissions.update'), [
            'role' => RoleName::Admin->value,
            'permissions' => [
                PermissionName::AccessAdminPanel->value,
                PermissionName::ManageUsers->value,
                PermissionName::ManageJobs->value,
            ],
        ])
        ->assertRedirect();

    $adminRole = Role::findByName(RoleName::Admin->value, 'web');

    expect($adminRole->hasPermissionTo(PermissionName::ManageJobs->value))->toBeTrue()
        ->and($adminRole->hasPermissionTo(PermissionName::ManageCms->value))->toBeFalse();
});

test('regular admins cannot update role permissions', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->put(route('admin.roles.permissions.update'), [
            'role' => RoleName::Admin->value,
            'permissions' => [PermissionName::AccessAdminPanel->value],
        ])
        ->assertRedirect(route('admin.dashboard'));
});
