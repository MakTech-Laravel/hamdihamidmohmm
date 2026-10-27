<?php

use App\Enums\JobApplicationStatus;
use App\Enums\JobPostStatus;
use App\Enums\PermissionName;
use App\Models\JobApplication;
use App\Models\JobApplicationStatusChange;
use App\Models\JobPost;
use App\Models\Role;
use App\Models\User;
use App\Support\EmployerJobAccess;
use App\Support\RoleAssigner;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

function panelScopedRole(User $owner, string $slug, array $permissions): Role
{
    $role = Role::query()->create([
        'name' => 'emp-'.$owner->id.'-'.$slug,
        'guard_name' => 'web',
        'label' => 'Panel '.$slug,
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

function panelMember(User $owner, string $role): User
{
    $member = User::factory()->employer()->create([
        'employer_owner_id' => $owner->id,
        'email' => fake()->unique()->safeEmail(),
    ]);

    RoleAssigner::assign($member, $role);

    return $member->fresh();
}

test('owner can assign and remove a panel member on a job', function () {
    $owner = User::factory()->employer()->create(['name' => 'Owner']);
    $role = panelScopedRole($owner, 'mgr', [
        PermissionName::EmployerJobs->value,
        PermissionName::EmployerApplications->value,
    ]);
    $member = panelMember($owner, $role->name);
    $job = JobPost::factory()->create([
        'employer_id' => $owner->id,
        'status' => JobPostStatus::Active,
    ]);

    $this->actingAs($owner)
        ->postJson(route('employer.jobs.panel.store', $job), [
            'user_id' => $member->id,
        ])
        ->assertSuccessful();

    expect($job->panelMembers()->whereKey($member->id)->exists())->toBeTrue();

    $this->actingAs($owner)
        ->getJson(route('employer.jobs.panel.index', $job))
        ->assertOk()
        ->assertJsonPath('assigned.0.id', $member->id)
        ->assertJsonPath('eligible', []);

    $this->actingAs($owner)
        ->deleteJson(route('employer.jobs.panel.destroy', [$job, $member]))
        ->assertSuccessful();

    expect($job->panelMembers()->whereKey($member->id)->exists())->toBeFalse();
});

test('owner cannot assign a user from another employer', function () {
    $owner = User::factory()->employer()->create();
    $otherOwner = User::factory()->employer()->create();
    $otherRole = panelScopedRole($otherOwner, 'mgr', [
        PermissionName::EmployerJobs->value,
    ]);
    $outsider = panelMember($otherOwner, $otherRole->name);
    $job = JobPost::factory()->create([
        'employer_id' => $owner->id,
        'status' => JobPostStatus::Active,
    ]);

    $this->actingAs($owner)
        ->postJson(route('employer.jobs.panel.store', $job), [
            'user_id' => $outsider->id,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('user_id');
});

test('assigned member only sees their assigned job and applications', function () {
    $owner = User::factory()->employer()->create();
    $role = panelScopedRole($owner, 'mgr', [
        PermissionName::EmployerJobs->value,
        PermissionName::EmployerApplications->value,
    ]);
    $member = panelMember($owner, $role->name);

    $assignedJob = JobPost::factory()->create([
        'employer_id' => $owner->id,
        'title' => 'Assigned Role',
        'status' => JobPostStatus::Active,
    ]);
    $otherJob = JobPost::factory()->create([
        'employer_id' => $owner->id,
        'title' => 'Hidden Role',
        'status' => JobPostStatus::Active,
    ]);

    EmployerJobAccess::assignMember($assignedJob, $member, $owner);

    $seeker = User::factory()->jobSeeker()->create();
    $assignedApp = JobApplication::factory()->create([
        'job_post_id' => $assignedJob->id,
        'job_seeker_id' => $seeker->id,
        'status' => JobApplicationStatus::Applied,
    ]);
    $hiddenApp = JobApplication::factory()->create([
        'job_post_id' => $otherJob->id,
        'job_seeker_id' => User::factory()->jobSeeker()->create()->id,
        'status' => JobApplicationStatus::Applied,
    ]);

    $this->actingAs($member)
        ->get(route('employer.jobs'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/User/EmployerJobs')
            ->has('jobs', 1)
            ->where('jobs.0.title', 'Assigned Role')
            ->where('can_manage_panel', false));

    $this->actingAs($member)
        ->get(route('employer.applications'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('applications', 1)
            ->where('applications.0.id', $assignedApp->id));

    $this->actingAs($member)
        ->get(route('employer.jobs.edit', $otherJob))
        ->assertForbidden();

    $this->actingAs($member)
        ->get(route('employer.applications.resume', $hiddenApp))
        ->assertForbidden();
});

test('unassigned member with jobs permission sees an empty job list', function () {
    $owner = User::factory()->employer()->create();
    $role = panelScopedRole($owner, 'mgr', [
        PermissionName::EmployerJobs->value,
        PermissionName::EmployerApplications->value,
    ]);
    $member = panelMember($owner, $role->name);

    JobPost::factory()->create([
        'employer_id' => $owner->id,
        'title' => 'Unassigned Vacancy',
        'status' => JobPostStatus::Active,
    ]);

    $this->actingAs($member)
        ->get(route('employer.jobs'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('jobs', 0));
});

test('member shortlist is visible to owner with status change actor', function () {
    $owner = User::factory()->employer()->create(['name' => 'Owner']);
    $role = panelScopedRole($owner, 'mgr', [
        PermissionName::EmployerJobs->value,
        PermissionName::EmployerApplications->value,
    ]);
    $member = panelMember($owner, $role->name);
    $member->forceFill(['name' => 'Panel Sara'])->save();

    $job = JobPost::factory()->create([
        'employer_id' => $owner->id,
        'status' => JobPostStatus::Active,
    ]);
    EmployerJobAccess::assignMember($job, $member, $owner);

    $application = JobApplication::factory()->create([
        'job_post_id' => $job->id,
        'job_seeker_id' => User::factory()->jobSeeker()->create()->id,
        'status' => JobApplicationStatus::Applied,
    ]);

    $this->actingAs($member)
        ->put(route('employer.applications.update', $application), [
            'status' => JobApplicationStatus::Shortlisted->value,
        ])
        ->assertRedirect();

    expect($application->fresh()->status)->toBe(JobApplicationStatus::Shortlisted);

    $change = JobApplicationStatusChange::query()
        ->where('job_application_id', $application->id)
        ->latest('id')
        ->first();

    expect($change)->not->toBeNull()
        ->and($change->changed_by)->toBe($member->id)
        ->and($change->to_status)->toBe(JobApplicationStatus::Shortlisted);

    $this->actingAs($owner)
        ->get(route('employer.applications'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('applications.0.status_value', JobApplicationStatus::Shortlisted->value)
            ->where('applications.0.status_changed_by', 'Panel Sara')
            ->where('applications.0.status_history.0.changed_by', 'Panel Sara'));
});

test('team member cannot manage job panel assignments', function () {
    $owner = User::factory()->employer()->create();
    $role = panelScopedRole($owner, 'mgr', [
        PermissionName::EmployerJobs->value,
        PermissionName::EmployerApplications->value,
    ]);
    $member = panelMember($owner, $role->name);
    $other = panelMember($owner, $role->name);
    $job = JobPost::factory()->create([
        'employer_id' => $owner->id,
        'status' => JobPostStatus::Active,
    ]);
    EmployerJobAccess::assignMember($job, $member, $owner);

    $this->actingAs($member)
        ->getJson(route('employer.jobs.panel.index', $job))
        ->assertForbidden();

    $this->actingAs($member)
        ->postJson(route('employer.jobs.panel.store', $job), [
            'user_id' => $other->id,
        ])
        ->assertForbidden();
});

test('owner still sees all jobs when members are assigned to some', function () {
    $owner = User::factory()->employer()->create();
    $role = panelScopedRole($owner, 'mgr', [
        PermissionName::EmployerJobs->value,
    ]);
    $member = panelMember($owner, $role->name);

    $jobA = JobPost::factory()->create([
        'employer_id' => $owner->id,
        'title' => 'Job A',
        'status' => JobPostStatus::Active,
    ]);
    JobPost::factory()->create([
        'employer_id' => $owner->id,
        'title' => 'Job B',
        'status' => JobPostStatus::Active,
    ]);
    EmployerJobAccess::assignMember($jobA, $member, $owner);

    $this->actingAs($owner)
        ->get(route('employer.jobs'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('jobs', 2)
            ->where('can_manage_panel', true));
});
