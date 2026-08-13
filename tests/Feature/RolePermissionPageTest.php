<?php

use App\Enums\PermissionName;
use App\Enums\RoleName;
use App\Models\Role;
use App\Models\User;

test('admins can view roles and permissions page', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.roles-permissions.index'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/Admin/RolePermissions')
            ->has('roles')
            ->has('permissionMatrix')
            ->has('permissionGroups'));
});

test('super admins can update admin role permissions', function () {
    $superAdmin = User::factory()->superAdmin()->create();
    $adminRole = Role::findByName(RoleName::Admin->value, 'web');

    $this->actingAs($superAdmin)
        ->put(route('admin.roles-permissions.update', $adminRole), [
            'label' => 'Admin',
            'permissions' => [
                PermissionName::AccessAdminPanel->value,
                PermissionName::ManageUsers->value,
                PermissionName::ManageJobs->value,
            ],
        ])
        ->assertRedirect(route('admin.roles-permissions.show', $adminRole));

    expect($adminRole->fresh()->hasPermissionTo(PermissionName::ManageJobs->value))->toBeTrue()
        ->and($adminRole->fresh()->hasPermissionTo(PermissionName::AccessAdminPanel->value))->toBeTrue()
        ->and($adminRole->fresh()->hasPermissionTo(PermissionName::ManageCms->value))->toBeFalse();
});

test('admin panel access is kept even if it is omitted', function () {
    $superAdmin = User::factory()->superAdmin()->create();
    $adminRole = Role::findByName(RoleName::Admin->value, 'web');

    $this->actingAs($superAdmin)
        ->put(route('admin.roles-permissions.update', $adminRole), [
            'label' => 'Admin',
            'permissions' => [
                PermissionName::ManageJobs->value,
            ],
        ])
        ->assertRedirect();

    expect($adminRole->fresh()->hasPermissionTo(
        PermissionName::AccessAdminPanel->value,
    ))->toBeTrue();
});

test('super admins can update job seeker permissions', function () {
    $superAdmin = User::factory()->superAdmin()->create();
    $seekerRole = Role::findByName(RoleName::JobSeeker->value, 'web');

    $this->actingAs($superAdmin)
        ->put(route('admin.roles-permissions.update', $seekerRole), [
            'label' => 'Job Seeker',
            'permissions' => [PermissionName::ManageJobs->value],
        ])
        ->assertRedirect();

    expect($seekerRole->fresh()->hasPermissionTo(PermissionName::ManageJobs->value))->toBeTrue()
        ->and($seekerRole->fresh()->hasPermissionTo(PermissionName::AccessAdminPanel->value))->toBeFalse();
});

test('super admins cannot update super admin permissions', function () {
    $superAdmin = User::factory()->superAdmin()->create();
    $superAdminRole = Role::findByName(RoleName::SuperAdmin->value, 'web');

    $this->actingAs($superAdmin)
        ->put(route('admin.roles-permissions.update', $superAdminRole), [
            'label' => 'Super Admin',
            'permissions' => [PermissionName::AccessAdminPanel->value],
        ])
        ->assertForbidden();
});

test('regular admins cannot update role permissions', function () {
    $admin = User::factory()->admin()->create();
    $adminRole = Role::findByName(RoleName::Admin->value, 'web');

    $this->actingAs($admin)
        ->put(route('admin.roles-permissions.update', $adminRole), [
            'label' => 'Admin',
            'permissions' => [PermissionName::AccessAdminPanel->value],
        ])
        ->assertRedirect(route('admin.dashboard'));
});
