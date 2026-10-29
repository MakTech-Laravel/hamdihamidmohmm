<?php

use App\Enums\JobApplicationStatus;
use App\Enums\JobPostStatus;
use App\Enums\PermissionName;
use App\Models\EmployerRosterEntry;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\Role;
use App\Models\User;
use App\Support\EmployerJobAccess;
use App\Support\RoleAssigner;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);

    $this->owner = User::factory()->employer()->create();
    $this->job = JobPost::factory()->create([
        'employer_id' => $this->owner->id,
        'title' => 'Backend Engineer',
        'status' => JobPostStatus::Active,
    ]);
    $this->seeker = User::factory()->jobSeeker()->create(['name' => 'Roster Candidate']);
    $this->application = JobApplication::factory()->create([
        'job_post_id' => $this->job->id,
        'job_seeker_id' => $this->seeker->id,
        'status' => JobApplicationStatus::Applied,
    ]);
});

test('employer owner can open roster board', function () {
    $this->actingAs($this->owner)
        ->get(route('employer.roster'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/User/EmployerRoster')
            ->has('entries.data', 0)
            ->has('categories', 0)
            ->where('is_owner', true)
            ->has('panel_members')
            ->where('filters.panel_member_id', ''));
});

test('employer can add an application to roster without changing status', function () {
    $this->actingAs($this->owner)
        ->post(route('employer.roster.store'), [
            'application_id' => $this->application->id,
            'category' => 'Talent pool',
            'comments' => 'Strong communicator',
        ])
        ->assertRedirect();

    $entry = EmployerRosterEntry::query()
        ->where('employer_owner_id', $this->owner->id)
        ->where('job_seeker_id', $this->seeker->id)
        ->first();

    expect($entry)->not->toBeNull()
        ->and($entry->category)->toBe('Talent pool')
        ->and($entry->comments)->toBe('Strong communicator')
        ->and($entry->job_application_id)->toBe($this->application->id)
        ->and($entry->added_by)->toBe($this->owner->id)
        ->and($this->application->fresh()->status)->toBe(JobApplicationStatus::Applied);
});

test('new category appears in roster options after save', function () {
    $this->actingAs($this->owner)
        ->post(route('employer.roster.store'), [
            'application_id' => $this->application->id,
            'category' => 'Future hire',
            'comments' => null,
        ])
        ->assertRedirect();

    $this->actingAs($this->owner)
        ->get(route('employer.roster'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('categories.0', 'Future hire')
            ->has('entries.data', 1)
            ->where('entries.data.0.category', 'Future hire'));

    $this->actingAs($this->owner)
        ->get(route('employer.applications'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('roster_categories.0', 'Future hire')
            ->where('applications.data.0.on_roster', true)
            ->where('applications.data.0.roster_entry_id', EmployerRosterEntry::query()->forAccount($this->owner->id)->value('id')));
});

test('re-adding the same seeker upserts instead of duplicating', function () {
    $otherJob = JobPost::factory()->create([
        'employer_id' => $this->owner->id,
        'status' => JobPostStatus::Active,
    ]);
    $otherApplication = JobApplication::factory()->create([
        'job_post_id' => $otherJob->id,
        'job_seeker_id' => $this->seeker->id,
        'status' => JobApplicationStatus::UnderReview,
    ]);

    $this->actingAs($this->owner)
        ->post(route('employer.roster.store'), [
            'application_id' => $this->application->id,
            'category' => 'Hold',
            'comments' => 'First note',
        ])
        ->assertRedirect();

    $this->actingAs($this->owner)
        ->post(route('employer.roster.store'), [
            'application_id' => $otherApplication->id,
            'category' => 'Referral',
            'comments' => 'Updated note',
        ])
        ->assertRedirect();

    expect(EmployerRosterEntry::query()->forAccount($this->owner->id)->count())->toBe(1);

    $entry = EmployerRosterEntry::query()->forAccount($this->owner->id)->first();

    expect($entry->category)->toBe('Referral')
        ->and($entry->comments)->toBe('Updated note')
        ->and($entry->job_application_id)->toBe($otherApplication->id);
});

test('cannot add another employers application to roster', function () {
    $foreign = User::factory()->employer()->create();
    $foreignJob = JobPost::factory()->create([
        'employer_id' => $foreign->id,
        'status' => JobPostStatus::Active,
    ]);
    $foreignApplication = JobApplication::factory()->create([
        'job_post_id' => $foreignJob->id,
        'job_seeker_id' => User::factory()->jobSeeker()->create()->id,
    ]);

    $this->actingAs($this->owner)
        ->post(route('employer.roster.store'), [
            'application_id' => $foreignApplication->id,
            'category' => 'Talent pool',
        ])
        ->assertSessionHasErrors('application_id');

    expect(EmployerRosterEntry::query()->count())->toBe(0);
});

test('team member with applications permission can add and remove roster entries', function () {
    $role = Role::query()->create([
        'name' => 'emp-'.$this->owner->id.'-recruiter',
        'guard_name' => 'web',
        'label' => 'Recruiter',
        'is_system' => false,
        'is_locked' => false,
        'employer_owner_id' => $this->owner->id,
    ]);
    $role->syncPermissions([
        PermissionName::AccessEmployerPortal->value,
        PermissionName::EmployerApplications->value,
    ]);

    $member = User::factory()->employer()->create([
        'employer_owner_id' => $this->owner->id,
    ]);
    RoleAssigner::assign($member, $role->name);

    $this->actingAs($member)
        ->post(route('employer.roster.store'), [
            'application_id' => $this->application->id,
            'category' => 'Board review',
            'comments' => 'From team',
        ])
        ->assertRedirect();

    $entry = EmployerRosterEntry::query()->forAccount($this->owner->id)->first();

    expect($entry)->not->toBeNull()
        ->and($entry->added_by)->toBe($member->id);

    $this->actingAs($member)
        ->get(route('employer.roster'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('entries.data', 1));

    $this->actingAs($member)
        ->delete(route('employer.roster.destroy', $entry))
        ->assertRedirect();

    expect(EmployerRosterEntry::query()->forAccount($this->owner->id)->exists())->toBeFalse();
});

test('roster index only lists the current employer account entries', function () {
    EmployerRosterEntry::query()->create([
        'employer_owner_id' => $this->owner->id,
        'job_seeker_id' => $this->seeker->id,
        'job_application_id' => $this->application->id,
        'category' => 'Ours',
        'comments' => null,
        'added_by' => $this->owner->id,
    ]);

    $otherOwner = User::factory()->employer()->create();
    $otherJob = JobPost::factory()->create([
        'employer_id' => $otherOwner->id,
        'status' => JobPostStatus::Active,
    ]);
    $otherSeeker = User::factory()->jobSeeker()->create();
    $otherApplication = JobApplication::factory()->create([
        'job_post_id' => $otherJob->id,
        'job_seeker_id' => $otherSeeker->id,
    ]);
    EmployerRosterEntry::query()->create([
        'employer_owner_id' => $otherOwner->id,
        'job_seeker_id' => $otherSeeker->id,
        'job_application_id' => $otherApplication->id,
        'category' => 'Theirs',
        'comments' => null,
        'added_by' => $otherOwner->id,
    ]);

    $this->actingAs($this->owner)
        ->get(route('employer.roster'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('entries.data', 1)
            ->where('entries.data.0.category', 'Ours')
            ->where('entries.data.0.name', 'Roster Candidate'));
});

test('roster entries include candidate preview and account applications', function () {
    $secondJob = JobPost::factory()->create([
        'employer_id' => $this->owner->id,
        'title' => 'Frontend Engineer',
        'status' => JobPostStatus::Active,
    ]);
    JobApplication::factory()->create([
        'job_post_id' => $secondJob->id,
        'job_seeker_id' => $this->seeker->id,
        'status' => JobApplicationStatus::UnderReview,
    ]);

    EmployerRosterEntry::query()->create([
        'employer_owner_id' => $this->owner->id,
        'job_seeker_id' => $this->seeker->id,
        'job_application_id' => $this->application->id,
        'category' => 'Talent pool',
        'comments' => 'Strong fit',
        'added_by' => $this->owner->id,
    ]);

    $this->actingAs($this->owner)
        ->get(route('employer.roster'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('entries.data', 1)
            ->where('entries.data.0.name', 'Roster Candidate')
            ->where('entries.data.0.job', 'Backend Engineer')
            ->where('entries.data.0.application_status_value', JobApplicationStatus::Applied->value)
            ->where('entries.data.0.applications_count', 2)
            ->has('entries.data.0.applications', 2)
            ->has('entries.data.0.candidate')
            ->where('entries.data.0.candidate.name', 'Roster Candidate')
            ->where('entries.data.0.candidate.job', 'Backend Engineer')
            ->where('entries.data.0.candidate.email', $this->seeker->email));
});

test('cannot destroy another employers roster entry', function () {
    $otherOwner = User::factory()->employer()->create();
    $otherJob = JobPost::factory()->create([
        'employer_id' => $otherOwner->id,
        'status' => JobPostStatus::Active,
    ]);
    $otherSeeker = User::factory()->jobSeeker()->create();
    $otherApplication = JobApplication::factory()->create([
        'job_post_id' => $otherJob->id,
        'job_seeker_id' => $otherSeeker->id,
    ]);
    $entry = EmployerRosterEntry::query()->create([
        'employer_owner_id' => $otherOwner->id,
        'job_seeker_id' => $otherSeeker->id,
        'job_application_id' => $otherApplication->id,
        'category' => 'Theirs',
        'comments' => null,
        'added_by' => $otherOwner->id,
    ]);

    $this->actingAs($this->owner)
        ->delete(route('employer.roster.destroy', $entry))
        ->assertForbidden();

    expect(EmployerRosterEntry::query()->whereKey($entry->id)->exists())->toBeTrue();
});

test('owner sees roster entries added by self and by team members', function () {
    $member = createRosterTeamMember($this->owner);

    $memberSeeker = User::factory()->jobSeeker()->create(['name' => 'Member Add']);
    $memberApplication = JobApplication::factory()->create([
        'job_post_id' => $this->job->id,
        'job_seeker_id' => $memberSeeker->id,
        'status' => JobApplicationStatus::Applied,
    ]);

    EmployerRosterEntry::query()->create([
        'employer_owner_id' => $this->owner->id,
        'job_seeker_id' => $this->seeker->id,
        'job_application_id' => $this->application->id,
        'category' => 'Owner add',
        'comments' => null,
        'added_by' => $this->owner->id,
    ]);

    EmployerRosterEntry::query()->create([
        'employer_owner_id' => $this->owner->id,
        'job_seeker_id' => $memberSeeker->id,
        'job_application_id' => $memberApplication->id,
        'category' => 'Member add',
        'comments' => null,
        'added_by' => $member->id,
    ]);

    $this->actingAs($this->owner)
        ->get(route('employer.roster'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('entries.data', 2)
            ->where('is_owner', true)
            ->has('panel_members', 2));
});

test('owner can filter roster by panel member added_by', function () {
    $member = createRosterTeamMember($this->owner);

    $memberSeeker = User::factory()->jobSeeker()->create(['name' => 'Member Add']);
    $memberApplication = JobApplication::factory()->create([
        'job_post_id' => $this->job->id,
        'job_seeker_id' => $memberSeeker->id,
        'status' => JobApplicationStatus::Applied,
    ]);

    EmployerRosterEntry::query()->create([
        'employer_owner_id' => $this->owner->id,
        'job_seeker_id' => $this->seeker->id,
        'job_application_id' => $this->application->id,
        'category' => 'Owner add',
        'comments' => null,
        'added_by' => $this->owner->id,
    ]);

    EmployerRosterEntry::query()->create([
        'employer_owner_id' => $this->owner->id,
        'job_seeker_id' => $memberSeeker->id,
        'job_application_id' => $memberApplication->id,
        'category' => 'Member add',
        'comments' => null,
        'added_by' => $member->id,
    ]);

    $this->actingAs($this->owner)
        ->get(route('employer.roster', ['panel_member_id' => $member->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('entries.data', 1)
            ->where('entries.data.0.category', 'Member add')
            ->where('filters.panel_member_id', $member->id));
});

test('team member only sees roster entries they added', function () {
    $member = createRosterTeamMember($this->owner);

    $memberSeeker = User::factory()->jobSeeker()->create(['name' => 'Member Add']);
    $memberApplication = JobApplication::factory()->create([
        'job_post_id' => $this->job->id,
        'job_seeker_id' => $memberSeeker->id,
        'status' => JobApplicationStatus::Applied,
    ]);

    EmployerRosterEntry::query()->create([
        'employer_owner_id' => $this->owner->id,
        'job_seeker_id' => $this->seeker->id,
        'job_application_id' => $this->application->id,
        'category' => 'Owner add',
        'comments' => null,
        'added_by' => $this->owner->id,
    ]);

    EmployerRosterEntry::query()->create([
        'employer_owner_id' => $this->owner->id,
        'job_seeker_id' => $memberSeeker->id,
        'job_application_id' => $memberApplication->id,
        'category' => 'Member add',
        'comments' => null,
        'added_by' => $member->id,
    ]);

    $this->actingAs($member)
        ->get(route('employer.roster'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('entries.data', 1)
            ->where('entries.data.0.category', 'Member add')
            ->where('is_owner', false)
            ->has('panel_members', 0));
});

test('team member cannot destroy owner roster entry but can destroy own', function () {
    $member = createRosterTeamMember($this->owner);

    $memberSeeker = User::factory()->jobSeeker()->create(['name' => 'Member Add']);
    $memberApplication = JobApplication::factory()->create([
        'job_post_id' => $this->job->id,
        'job_seeker_id' => $memberSeeker->id,
        'status' => JobApplicationStatus::Applied,
    ]);

    $ownerEntry = EmployerRosterEntry::query()->create([
        'employer_owner_id' => $this->owner->id,
        'job_seeker_id' => $this->seeker->id,
        'job_application_id' => $this->application->id,
        'category' => 'Owner add',
        'comments' => null,
        'added_by' => $this->owner->id,
    ]);

    $memberEntry = EmployerRosterEntry::query()->create([
        'employer_owner_id' => $this->owner->id,
        'job_seeker_id' => $memberSeeker->id,
        'job_application_id' => $memberApplication->id,
        'category' => 'Member add',
        'comments' => null,
        'added_by' => $member->id,
    ]);

    $this->actingAs($member)
        ->delete(route('employer.roster.destroy', $ownerEntry))
        ->assertForbidden();

    expect(EmployerRosterEntry::query()->whereKey($ownerEntry->id)->exists())->toBeTrue();

    $this->actingAs($member)
        ->delete(route('employer.roster.destroy', $memberEntry))
        ->assertRedirect();

    expect(EmployerRosterEntry::query()->whereKey($memberEntry->id)->exists())->toBeFalse();
});

test('owner and team member can both roster the same seeker', function () {
    $member = createRosterTeamMember($this->owner);

    $this->actingAs($this->owner)
        ->post(route('employer.roster.store'), [
            'application_id' => $this->application->id,
            'category' => 'Owner list',
            'comments' => 'Mine',
        ])
        ->assertRedirect();

    $this->actingAs($member)
        ->post(route('employer.roster.store'), [
            'application_id' => $this->application->id,
            'category' => 'Member list',
            'comments' => 'Theirs',
        ])
        ->assertRedirect();

    $entries = EmployerRosterEntry::query()
        ->forAccount($this->owner->id)
        ->where('job_seeker_id', $this->seeker->id)
        ->get();

    expect($entries)->toHaveCount(2)
        ->and($entries->pluck('added_by')->sort()->values()->all())
        ->toBe(collect([$this->owner->id, $member->id])->sort()->values()->all());
});

test('owner all roster view shows each seeker once and filter shows that members adds', function () {
    $member = createRosterTeamMember($this->owner);

    EmployerRosterEntry::query()->create([
        'employer_owner_id' => $this->owner->id,
        'job_seeker_id' => $this->seeker->id,
        'job_application_id' => $this->application->id,
        'category' => 'Owner list',
        'comments' => null,
        'added_by' => $this->owner->id,
    ]);

    EmployerRosterEntry::query()->create([
        'employer_owner_id' => $this->owner->id,
        'job_seeker_id' => $this->seeker->id,
        'job_application_id' => $this->application->id,
        'category' => 'Member list',
        'comments' => null,
        'added_by' => $member->id,
    ]);

    $this->actingAs($this->owner)
        ->get(route('employer.roster'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('entries.data', 1)
            ->where('entries.data.0.name', 'Roster Candidate')
            ->where(
                'entries.data.0.category',
                fn (string $value): bool => str_contains($value, 'Owner list')
                    && str_contains($value, 'Member list'),
            )
            ->where(
                'entries.data.0.added_by',
                fn (string $value): bool => str_contains($value, $this->owner->name)
                    && str_contains($value, $member->name),
            ));

    $this->actingAs($this->owner)
        ->get(route('employer.roster', ['panel_member_id' => $member->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('entries.data', 1)
            ->where('entries.data.0.category', 'Member list')
            ->where('entries.data.0.added_by', $member->name));
});

test('applications on_roster is personal to the current user', function () {
    $member = createRosterTeamMember($this->owner);
    EmployerJobAccess::assignMember($this->job, $member, $this->owner);

    EmployerRosterEntry::query()->create([
        'employer_owner_id' => $this->owner->id,
        'job_seeker_id' => $this->seeker->id,
        'job_application_id' => $this->application->id,
        'category' => 'Owner add',
        'comments' => null,
        'added_by' => $this->owner->id,
    ]);

    $this->actingAs($member)
        ->get(route('employer.applications'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('applications.data', 1)
            ->where('applications.data.0.on_roster', false)
            ->where('applications.data.0.roster_entry_id', null));

    $memberEntry = EmployerRosterEntry::query()->create([
        'employer_owner_id' => $this->owner->id,
        'job_seeker_id' => $this->seeker->id,
        'job_application_id' => $this->application->id,
        'category' => 'Member add',
        'comments' => null,
        'added_by' => $member->id,
    ]);

    $this->actingAs($member)
        ->get(route('employer.applications'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('applications.data.0.on_roster', true)
            ->where('applications.data.0.roster_entry_id', $memberEntry->id));

    $this->actingAs($this->owner)
        ->get(route('employer.applications'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('applications.data.0.on_roster', true)
            ->where(
                'applications.data.0.roster_entry_id',
                EmployerRosterEntry::query()
                    ->forAccount($this->owner->id)
                    ->where('added_by', $this->owner->id)
                    ->value('id'),
            ));
});

test('owner destroy without purge_all removes only that entry', function () {
    $member = createRosterTeamMember($this->owner);

    $ownerEntry = EmployerRosterEntry::query()->create([
        'employer_owner_id' => $this->owner->id,
        'job_seeker_id' => $this->seeker->id,
        'job_application_id' => $this->application->id,
        'category' => 'Owner add',
        'comments' => null,
        'added_by' => $this->owner->id,
    ]);

    $memberEntry = EmployerRosterEntry::query()->create([
        'employer_owner_id' => $this->owner->id,
        'job_seeker_id' => $this->seeker->id,
        'job_application_id' => $this->application->id,
        'category' => 'Member add',
        'comments' => null,
        'added_by' => $member->id,
    ]);

    $this->actingAs($this->owner)
        ->delete(route('employer.roster.destroy', $memberEntry))
        ->assertRedirect();

    expect(EmployerRosterEntry::query()->whereKey($memberEntry->id)->exists())->toBeFalse()
        ->and(EmployerRosterEntry::query()->whereKey($ownerEntry->id)->exists())->toBeTrue();
});

test('owner destroy with purge_all removes every entry for that seeker', function () {
    $member = createRosterTeamMember($this->owner);

    $ownerEntry = EmployerRosterEntry::query()->create([
        'employer_owner_id' => $this->owner->id,
        'job_seeker_id' => $this->seeker->id,
        'job_application_id' => $this->application->id,
        'category' => 'Owner add',
        'comments' => null,
        'added_by' => $this->owner->id,
    ]);

    EmployerRosterEntry::query()->create([
        'employer_owner_id' => $this->owner->id,
        'job_seeker_id' => $this->seeker->id,
        'job_application_id' => $this->application->id,
        'category' => 'Member add',
        'comments' => null,
        'added_by' => $member->id,
    ]);

    $this->actingAs($this->owner)
        ->delete(route('employer.roster.destroy', $ownerEntry), ['purge_all' => 1])
        ->assertRedirect();

    expect(EmployerRosterEntry::query()->forAccount($this->owner->id)->where('job_seeker_id', $this->seeker->id)->count())
        ->toBe(0);
});

test('applications page exposes is_owner and owner purge clears all personal rows', function () {
    $member = createRosterTeamMember($this->owner);

    $ownerEntry = EmployerRosterEntry::query()->create([
        'employer_owner_id' => $this->owner->id,
        'job_seeker_id' => $this->seeker->id,
        'job_application_id' => $this->application->id,
        'category' => 'Owner add',
        'comments' => null,
        'added_by' => $this->owner->id,
    ]);

    EmployerRosterEntry::query()->create([
        'employer_owner_id' => $this->owner->id,
        'job_seeker_id' => $this->seeker->id,
        'job_application_id' => $this->application->id,
        'category' => 'Member add',
        'comments' => null,
        'added_by' => $member->id,
    ]);

    $this->actingAs($this->owner)
        ->get(route('employer.applications'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('is_owner', true));

    $this->actingAs($this->owner)
        ->delete(route('employer.roster.destroy', $ownerEntry), ['purge_all' => 1])
        ->assertRedirect();

    expect(EmployerRosterEntry::query()->forAccount($this->owner->id)->where('job_seeker_id', $this->seeker->id)->count())
        ->toBe(0);
});

test('team member roster categories only include their own adds', function () {
    $member = createRosterTeamMember($this->owner);

    EmployerRosterEntry::query()->create([
        'employer_owner_id' => $this->owner->id,
        'job_seeker_id' => $this->seeker->id,
        'job_application_id' => $this->application->id,
        'category' => 'Owner only category',
        'comments' => null,
        'added_by' => $this->owner->id,
    ]);

    $memberSeeker = User::factory()->jobSeeker()->create();
    $memberApplication = JobApplication::factory()->create([
        'job_post_id' => $this->job->id,
        'job_seeker_id' => $memberSeeker->id,
        'status' => JobApplicationStatus::Applied,
    ]);

    EmployerRosterEntry::query()->create([
        'employer_owner_id' => $this->owner->id,
        'job_seeker_id' => $memberSeeker->id,
        'job_application_id' => $memberApplication->id,
        'category' => 'Member only category',
        'comments' => null,
        'added_by' => $member->id,
    ]);

    $this->actingAs($member)
        ->get(route('employer.roster'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('is_owner', false)
            ->has('categories', 1)
            ->where('categories.0', 'Member only category'));
});

function createRosterTeamMember(User $owner): User
{
    $role = Role::query()->create([
        'name' => 'emp-'.$owner->id.'-roster-'.uniqid(),
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

    $member = User::factory()->employer()->create([
        'employer_owner_id' => $owner->id,
    ]);
    RoleAssigner::assign($member, $role->name);

    return $member;
}

test('roster paginates thirty entries per page', function () {
    $seekers = User::factory()->jobSeeker()->count(31)->create();

    foreach ($seekers as $seeker) {
        EmployerRosterEntry::query()->create([
            'employer_owner_id' => $this->owner->id,
            'job_seeker_id' => $seeker->id,
            'job_application_id' => $this->application->id,
            'category' => 'Bulk',
            'comments' => null,
            'added_by' => $this->owner->id,
        ]);
    }

    $this->actingAs($this->owner)
        ->get(route('employer.roster'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('entries.data', 30)
            ->where('entries.total', 31)
            ->where('entries.per_page', 30)
            ->where('entries.last_page', 2));

    $this->actingAs($this->owner)
        ->get(route('employer.roster', ['page' => 2]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('entries.data', 1));
});

test('owner roster pagination dedupes by seeker and merges all rows for page seekers', function () {
    $member = createRosterTeamMember($this->owner);

    foreach ([$this->owner, $member] as $adder) {
        EmployerRosterEntry::query()->create([
            'employer_owner_id' => $this->owner->id,
            'job_seeker_id' => $this->seeker->id,
            'job_application_id' => $this->application->id,
            'category' => 'List '.$adder->id,
            'comments' => null,
            'added_by' => $adder->id,
        ]);
    }

    $otherSeekers = User::factory()->jobSeeker()->count(30)->create();

    foreach ($otherSeekers as $other) {
        EmployerRosterEntry::query()->create([
            'employer_owner_id' => $this->owner->id,
            'job_seeker_id' => $other->id,
            'job_application_id' => $this->application->id,
            'category' => 'Other',
            'comments' => null,
            'added_by' => $this->owner->id,
        ]);
    }

    $this->actingAs($this->owner)
        ->get(route('employer.roster', ['page' => 2]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('entries.total', 31)
            ->has('entries.data', 1)
            ->where('entries.data.0.name', 'Roster Candidate')
            ->where(
                'entries.data.0.added_by',
                fn (string $value): bool => str_contains($value, $this->owner->name)
                    && str_contains($value, $member->name),
            )
            ->where(
                'entries.data.0.category',
                fn (string $value): bool => str_contains($value, 'List '.$this->owner->id)
                    && str_contains($value, 'List '.$member->id),
            ));
});
