<?php

use App\Enums\PermissionName;
use App\Enums\RoleName;
use App\Enums\UserRole;
use App\Models\Role;
use App\Models\User;

test('super admins can create a custom role with permissions', function () {
    $superAdmin = User::factory()->superAdmin()->create();

    $this->actingAs($superAdmin)
        ->get(route('admin.roles-permissions.create'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/Admin/RoleCreate')
            ->has('permissionGroups'));

    $this->actingAs($superAdmin)
        ->post(route('admin.roles-permissions.store'), [
            'label' => 'Moderator',
            'description' => 'Reviews jobs and verifications.',
            'permissions' => [
                PermissionName::ManageJobs->value,
                PermissionName::ManageVerification->value,
            ],
        ])
        ->assertRedirect();

    $role = Role::query()->where('name', 'moderator')->first();

    expect($role)->not->toBeNull()
        ->and($role->displayLabel())->toBe('Moderator')
        ->and($role->is_system)->toBeFalse()
        ->and($role->hasPermissionTo(PermissionName::AccessAdminPanel->value))->toBeTrue()
        ->and($role->hasPermissionTo(PermissionName::ManageJobs->value))->toBeTrue();
});

test('super admins can view and edit a role', function () {
    $superAdmin = User::factory()->superAdmin()->create();
    $adminRole = Role::findByName(RoleName::Admin->value, 'web');

    $this->actingAs($superAdmin)
        ->get(route('admin.roles-permissions.show', $adminRole))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/Admin/RoleShow')
            ->where('managedRole.value', RoleName::Admin->value));

    $this->actingAs($superAdmin)
        ->get(route('admin.roles-permissions.edit', $adminRole))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/Admin/RoleEdit'));
});

test('super admins can delete an unused custom role', function () {
    $superAdmin = User::factory()->superAdmin()->create();
    $role = Role::query()->create([
        'name' => 'auditor',
        'guard_name' => 'web',
        'label' => 'Auditor',
        'is_system' => false,
        'is_locked' => false,
    ]);

    $this->actingAs($superAdmin)
        ->delete(route('admin.roles-permissions.destroy', $role))
        ->assertRedirect(route('admin.roles-permissions.index'));

    expect(Role::query()->where('name', 'auditor')->exists())->toBeFalse();
});

test('system roles cannot be deleted', function () {
    $superAdmin = User::factory()->superAdmin()->create();
    $adminRole = Role::findByName(RoleName::Admin->value, 'web');

    $this->actingAs($superAdmin)
        ->delete(route('admin.roles-permissions.destroy', $adminRole))
        ->assertForbidden();
});

test('admins can assign a custom role to a user', function () {
    $superAdmin = User::factory()->superAdmin()->create();
    $seeker = User::factory()->jobSeeker()->create();
    $role = Role::query()->create([
        'name' => 'moderator',
        'guard_name' => 'web',
        'label' => 'Moderator',
        'is_system' => false,
        'is_locked' => false,
    ]);
    $role->syncPermissions([
        PermissionName::AccessAdminPanel->value,
        PermissionName::ManageJobs->value,
    ]);

    $this->actingAs($superAdmin)
        ->put(route('admin.users.update', $seeker), [
            'name' => $seeker->name,
            'email' => $seeker->email,
            'role' => 'moderator',
        ])
        ->assertRedirect();

    $seeker->refresh();

    expect($seeker->hasRole('moderator'))->toBeTrue()
        ->and($seeker->role)->toBe(UserRole::Admin)
        ->and($seeker->role_label)->toBe('Moderator');
});
