<?php

use App\Enums\PermissionName;
use App\Enums\RoleName;
use App\Models\Role;
use App\Models\User;
use App\Support\RoleAssigner;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('employer owner can create a scoped panel role without owner-only permissions', function () {
    $owner = User::factory()->employer()->create();

    $this->actingAs($owner)
        ->post(route('employer.roles.store'), [
            'label' => 'Senior Recruiter',
            'description' => 'Jobs and applications only',
            'permissions' => [
                PermissionName::EmployerJobs->value,
                PermissionName::EmployerApplications->value,
                PermissionName::EmployerPackages->value,
            ],
        ])
        ->assertRedirect(route('employer.roles'));

    $role = Role::query()
        ->where('employer_owner_id', $owner->id)
        ->where('label', 'Senior Recruiter')
        ->first();

    expect($role)->not->toBeNull()
        ->and($role->name)->toStartWith('emp-'.$owner->id.'-')
        ->and($role->hasPermissionTo(PermissionName::AccessEmployerPortal->value))->toBeTrue()
        ->and($role->hasPermissionTo(PermissionName::EmployerJobs->value))->toBeTrue()
        ->and($role->hasPermissionTo(PermissionName::EmployerApplications->value))->toBeTrue()
        ->and($role->hasPermissionTo(PermissionName::EmployerPackages->value))->toBeFalse()
        ->and($role->hasPermissionTo(PermissionName::EmployerTeam->value))->toBeFalse();
});

test('owner can assign a custom role to a team member', function () {
    $owner = User::factory()->employer()->create();

    $role = Role::query()->create([
        'name' => 'emp-'.$owner->id.'-recruiter',
        'guard_name' => 'web',
        'label' => 'Recruiter',
        'is_system' => false,
        'is_locked' => false,
        'employer_owner_id' => $owner->id,
    ]);
    $role->syncPermissions([
        PermissionName::AccessEmployerPortal->value,
        PermissionName::EmployerApplications->value,
    ]);

    $this->actingAs($owner)
        ->post(route('employer.team.store'), [
            'name' => 'Panel Member',
            'email' => 'recruiter@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => $role->name,
        ])
        ->assertRedirect(route('employer.team'));

    $member = User::query()->where('email', 'recruiter@example.com')->first();

    expect($member)->not->toBeNull()
        ->and($member->employer_owner_id)->toBe($owner->id)
        ->and($member->hasRole($role->name))->toBeTrue()
        ->and($member->can(PermissionName::EmployerApplications->value))->toBeTrue()
        ->and($member->can(PermissionName::EmployerJobs->value))->toBeFalse();

    $this->actingAs($member)
        ->get(route('employer.applications'))
        ->assertOk();

    $this->actingAs($member)
        ->get(route('employer.jobs'))
        ->assertForbidden();
});

test('employer cannot manage another employers custom role', function () {
    $owner = User::factory()->employer()->create();
    $other = User::factory()->employer()->create();

    $role = Role::query()->create([
        'name' => 'emp-'.$owner->id.'-secret',
        'guard_name' => 'web',
        'label' => 'Secret',
        'employer_owner_id' => $owner->id,
    ]);

    $this->actingAs($other)
        ->get(route('employer.roles.edit', $role))
        ->assertNotFound();
});

test('team member cannot open employer roles pages', function () {
    $owner = User::factory()->employer()->create();
    $member = User::factory()->employer()->create([
        'employer_owner_id' => $owner->id,
    ]);
    RoleAssigner::assign($member, RoleName::EmployerManager->value);

    $this->actingAs($member->fresh())
        ->get(route('employer.roles'))
        ->assertForbidden();
});

test('admin roles index excludes employer scoped roles', function () {
    $admin = User::factory()->admin()->create();
    $owner = User::factory()->employer()->create();

    Role::query()->create([
        'name' => 'emp-'.$owner->id.'-hidden',
        'guard_name' => 'web',
        'label' => 'Hidden Company Role',
        'employer_owner_id' => $owner->id,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.roles-permissions.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/Admin/RolePermissions')
            ->where('roles', fn ($roles) => collect($roles)->every(
                fn ($role) => ($role['value'] ?? '') !== 'emp-'.$owner->id.'-hidden'
            )));
});

test('cannot delete a custom role while users are assigned', function () {
    $owner = User::factory()->employer()->create();

    $role = Role::query()->create([
        'name' => 'emp-'.$owner->id.'-busy',
        'guard_name' => 'web',
        'label' => 'Busy',
        'employer_owner_id' => $owner->id,
    ]);
    $role->syncPermissions([PermissionName::AccessEmployerPortal->value]);

    $member = User::factory()->employer()->create([
        'employer_owner_id' => $owner->id,
    ]);
    RoleAssigner::assign($member, $role->name);

    $this->actingAs($owner)
        ->delete(route('employer.roles.destroy', $role))
        ->assertForbidden();

    expect(Role::query()->whereKey($role->id)->exists())->toBeTrue();
});
