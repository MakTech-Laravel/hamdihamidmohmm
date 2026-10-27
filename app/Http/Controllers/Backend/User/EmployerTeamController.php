<?php

namespace App\Http\Controllers\Backend\User;

use App\Enums\EmployerAccountStatus;
use App\Enums\EmployerVerificationStatus;
use App\Enums\PermissionName;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\User\StoreEmployerTeamMemberRequest;
use App\Http\Requests\Backend\User\UpdateEmployerTeamMemberRequest;
use App\Models\User;
use App\Support\EmployerAssignableRoles;
use App\Support\RoleAssigner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class EmployerTeamController extends Controller
{
    public function index(Request $request): Response
    {
        $owner = $request->user();
        abort_unless(
            $owner?->isEmployerOwner() === true
            && $owner->can(PermissionName::EmployerTeam->value),
            403,
        );

        $members = User::query()
            ->where('employer_owner_id', $owner->id)
            ->orderBy('name')
            ->get()
            ->map(fn (User $member): array => [
                'id' => $member->id,
                'name' => $member->name,
                'email' => $member->email,
                'role' => $member->getRoleNames()->first(),
                'role_label' => $member->role_label,
                'created_at' => $member->created_at?->toDateString(),
            ]);

        return Inertia::render('backend/User/EmployerTeam', [
            'members' => $members,
            'roleOptions' => EmployerAssignableRoles::options($owner),
        ]);
    }

    public function store(StoreEmployerTeamMemberRequest $request): RedirectResponse
    {
        $owner = $request->user();
        abort_unless($owner !== null, 403);

        $roleName = $request->string('role')->toString();
        $role = RoleAssigner::resolve($roleName);
        abort_unless(RoleAssigner::isAssignableEmployerMemberRole($role, $owner), 403);

        $member = User::query()->create([
            'name' => $request->string('name')->toString(),
            'email' => $request->string('email')->toString(),
            'password' => Hash::make($request->string('password')->toString()),
            'role' => UserRole::Employer,
            'employer_owner_id' => $owner->id,
            'email_verified_at' => now(),
            'account_status' => EmployerAccountStatus::Active,
            'verification_status' => EmployerVerificationStatus::Approved,
            'verified_at' => now(),
        ]);

        RoleAssigner::assign($member, $roleName);

        return redirect()
            ->route('employer.team')
            ->with('success', 'Team member invited.');
    }

    public function update(UpdateEmployerTeamMemberRequest $request, User $member): RedirectResponse
    {
        $owner = $request->user();
        abort_unless($owner !== null, 403);

        $roleName = $request->string('role')->toString();
        $role = RoleAssigner::resolve($roleName);
        abort_unless(RoleAssigner::isAssignableEmployerMemberRole($role, $owner), 403);

        RoleAssigner::assign($member, $roleName);

        return back()->with('success', 'Team member role updated.');
    }

    public function destroy(Request $request, User $member): RedirectResponse
    {
        $owner = $request->user();

        abort_unless(
            $owner?->isEmployerOwner() === true
            && $owner->can(PermissionName::EmployerTeam->value)
            && (int) $member->employer_owner_id === (int) $owner->id,
            403,
        );

        $member->delete();

        return back()->with('success', 'Team member removed.');
    }
}
