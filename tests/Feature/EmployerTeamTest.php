<?php

use App\Enums\JobPostStatus;
use App\Enums\PermissionName;
use App\Enums\RoleName;
use App\Models\JobPost;
use App\Models\Role;
use App\Models\User;
use App\Support\EmployerJobAccess;
use App\Support\RoleAssigner;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

function makeEmployerScopedRole(User $owner, string $slug, array $permissions, string $label = 'Panel role'): Role
{
    $role = Role::query()->create([
        'name' => 'emp-'.$owner->id.'-'.$slug,
        'guard_name' => 'web',
        'label' => $label,
        'is_system' => false,
        'is_locked' => false,
        'employer_owner_id' => $owner->id,
    ]);

    $role->syncPermissions([
        PermissionName::AccessEmployerPortal->value,
        ...$permissions,
    ]);

    return $role;
}

function makeEmployerMember(User $owner, string $role): User
{
    $member = User::factory()->employer()->create([
        'employer_owner_id' => $owner->id,
        'email' => fake()->unique()->safeEmail(),
    ]);

    RoleAssigner::assign($member, $role);

    return $member->fresh();
}

test('employer owner can invite a member with a custom panel role', function () {
    $owner = User::factory()->employer()->create();
    $role = makeEmployerScopedRole($owner, 'manager', [
        PermissionName::EmployerJobs->value,
        PermissionName::EmployerApplications->value,
    ], 'Hiring Manager');

    $this->actingAs($owner)
        ->post(route('employer.team.store'), [
            'name' => 'Hiring Manager',
            'email' => 'manager@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => $role->name,
        ])
        ->assertRedirect(route('employer.team'));

    $member = User::query()->where('email', 'manager@example.com')->first();

    expect($member)->not->toBeNull()
        ->and($member->employer_owner_id)->toBe($owner->id)
        ->and($member->hasRole($role->name))->toBeTrue()
        ->and($member->can(PermissionName::EmployerJobs->value))->toBeTrue()
        ->and($member->can(PermissionName::EmployerTeam->value))->toBeFalse();
});

test('employer owner cannot invite with system manager or interviewer roles', function () {
    $owner = User::factory()->employer()->create();

    $this->actingAs($owner)
        ->post(route('employer.team.store'), [
            'name' => 'System Manager',
            'email' => 'system-manager@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => RoleName::EmployerManager->value,
        ])
        ->assertSessionHasErrors('role');

    $this->actingAs($owner)
        ->post(route('employer.team.store'), [
            'name' => 'System Interviewer',
            'email' => 'system-interviewer@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => RoleName::EmployerInterviewer->value,
        ])
        ->assertSessionHasErrors('role');

    expect(User::query()->where('email', 'system-manager@example.com')->exists())->toBeFalse()
        ->and(User::query()->where('email', 'system-interviewer@example.com')->exists())->toBeFalse();
});

test('team page only lists employer custom roles', function () {
    $owner = User::factory()->employer()->create();
    $custom = makeEmployerScopedRole($owner, 'board', [
        PermissionName::EmployerApplications->value,
    ], 'Board Member');

    $this->actingAs($owner)
        ->get(route('employer.team'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/User/EmployerTeam')
            ->has('roleOptions', 1)
            ->where('roleOptions.0.value', $custom->name)
            ->where('roleOptions.0.label', 'Board Member'));
});

test('manager can see assigned owner jobs and interviewer cannot open jobs', function () {
    $owner = User::factory()->employer()->create();
    $job = JobPost::factory()->create([
        'employer_id' => $owner->id,
        'title' => 'Shared Vacancy',
        'status' => JobPostStatus::Active,
    ]);

    $managerRole = makeEmployerScopedRole($owner, 'mgr', [
        PermissionName::EmployerJobs->value,
        PermissionName::EmployerApplications->value,
    ]);
    $interviewerRole = makeEmployerScopedRole($owner, 'iv', [
        PermissionName::EmployerApplications->value,
    ]);

    $manager = makeEmployerMember($owner, $managerRole->name);
    $interviewer = makeEmployerMember($owner, $interviewerRole->name);
    EmployerJobAccess::assignMember($job, $manager, $owner);

    $this->actingAs($owner)
        ->get(route('employer.jobs'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('auth.user.is_employer_owner', true)
            ->where('translations', fn ($translations) => ($translations['employer.nav.jobs'] ?? null) === 'My Jobs'
                && ($translations['employer.nav.jobs_panel'] ?? null) === 'Jobs & CVs'));

    $this->actingAs($manager)
        ->get(route('employer.jobs'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/User/EmployerJobs')
            ->where('auth.user.is_employer_owner', false)
            ->has('jobs', 1)
            ->where('jobs.0.title', 'Shared Vacancy'));

    $this->actingAs($interviewer)
        ->get(route('employer.jobs'))
        ->assertForbidden();

    $this->actingAs($interviewer)
        ->get(route('employer.applications'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('applications', 0));
});

test('interviewer cannot open settings or team', function () {
    $owner = User::factory()->employer()->create();
    $interviewerRole = makeEmployerScopedRole($owner, 'iv', [
        PermissionName::EmployerApplications->value,
    ]);
    $interviewer = makeEmployerMember($owner, $interviewerRole->name);

    $this->actingAs($interviewer)
        ->get(route('employer.settings'))
        ->assertForbidden();

    $this->actingAs($interviewer)
        ->get(route('employer.team'))
        ->assertForbidden();
});

test('team members cannot access another employer account jobs', function () {
    $owner = User::factory()->employer()->create();
    $foreign = User::factory()->employer()->create();
    JobPost::factory()->create([
        'employer_id' => $foreign->id,
        'title' => 'Foreign Vacancy',
        'status' => JobPostStatus::Active,
    ]);

    $managerRole = makeEmployerScopedRole($owner, 'mgr', [
        PermissionName::EmployerJobs->value,
    ]);
    $manager = makeEmployerMember($owner, $managerRole->name);

    $this->actingAs($manager)
        ->get(route('employer.jobs'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('jobs', 0));
});

test('owner can remove a team member', function () {
    $owner = User::factory()->employer()->create();
    $role = makeEmployerScopedRole($owner, 'mgr', [
        PermissionName::EmployerJobs->value,
    ]);
    $member = makeEmployerMember($owner, $role->name);

    $this->actingAs($owner)
        ->delete(route('employer.team.destroy', $member))
        ->assertRedirect();

    expect(User::query()->whereKey($member->id)->exists())->toBeFalse();
});
