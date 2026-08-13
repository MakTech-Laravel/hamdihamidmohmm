<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Enums\ActivityAction;
use App\Enums\RoleName;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\UpdateManagedUserRequest;
use App\Models\Role;
use App\Models\User;
use App\Support\ActivityLogger;
use App\Support\RoleAssigner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->canManageUsers(), 403);

        $roleFilter = $request->string('role')->toString();

        $usersQuery = User::query()->with('roles')->latest();

        if ($roleFilter !== '' && Role::query()->web()->where('name', $roleFilter)->exists()) {
            $usersQuery->role($roleFilter);
        }

        $users = $usersQuery
            ->paginate(12)
            ->withQueryString()
            ->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role?->value,
                'role_name' => $user->assignedRoleName(),
                'role_label' => $user->role_label,
                'permissions' => $user->getAllPermissions()->pluck('name')->values()->all(),
                'created_at' => $user->created_at?->toDateString(),
                'is_self' => $user->id === $request->user()?->id,
            ]);

        $roleCounts = [
            'all' => User::query()->count(),
            RoleName::SuperAdmin->value => User::query()->role(RoleName::SuperAdmin->value)->count(),
            RoleName::Admin->value => User::query()->role(RoleName::Admin->value)->count(),
            RoleName::JobSeeker->value => User::query()->role(RoleName::JobSeeker->value)->count(),
            RoleName::Employer->value => User::query()->role(RoleName::Employer->value)->count(),
        ];

        return Inertia::render('backend/Admin/UserManagement', [
            'users' => $users,
            'filters' => [
                'role' => $roleFilter,
            ],
            'roleCounts' => $roleCounts,
            'roles' => $this->roleOptions(),
            'canManageAdmins' => $request->user()?->canManageAdmins() === true,
        ]);
    }

    public function show(Request $request, User $user): Response
    {
        abort_unless($request->user()?->canManageUsers(), 403);

        return Inertia::render('backend/Admin/UserShow', $this->userPageProps($request, $user));
    }

    public function edit(Request $request, User $user): Response
    {
        abort_unless($request->user()?->canManageUsers(), 403);
        abort_if($user->isSuperAdmin() && ! $request->user()?->canManageAdmins(), 403);

        return Inertia::render('backend/Admin/UserEdit', $this->userPageProps($request, $user, includeRoles: true));
    }

    public function update(UpdateManagedUserRequest $request, User $user): RedirectResponse
    {
        abort_if(
            $user->id === $request->user()?->id
            && $request->string('role')->toString() !== $user->assignedRoleName(),
            403,
            'You cannot change your own role.',
        );

        $nextRole = RoleAssigner::resolve($request->string('role')->toString());

        if ($nextRole->name === RoleName::SuperAdmin->value && ! $request->user()?->canManageAdmins()) {
            abort(403);
        }

        $actor = $request->user();
        $originalName = $user->name;
        $originalEmail = $user->email;
        $originalCompany = $user->company_name;
        $originalRoleName = $user->assignedRoleName();
        $originalRoleLabel = $user->role_label;

        $user->forceFill([
            'name' => $request->string('name')->toString(),
            'email' => $request->string('email')->toString(),
            'company_name' => $request->filled('company_name')
                ? $request->string('company_name')->toString()
                : null,
        ]);

        if ($request->filled('password')) {
            $user->password = $request->string('password')->toString();

            ActivityLogger::log(
                $user,
                ActivityAction::PasswordUpdated,
                'Password was reset by an administrator.',
                $actor,
            );
        }

        $user->save();

        $profileChanges = array_filter([
            'name' => $originalName !== $user->name ? ['from' => $originalName, 'to' => $user->name] : null,
            'email' => $originalEmail !== $user->email ? ['from' => $originalEmail, 'to' => $user->email] : null,
            'company_name' => $originalCompany !== $user->company_name
                ? ['from' => $originalCompany, 'to' => $user->company_name]
                : null,
        ]);

        if ($profileChanges !== []) {
            ActivityLogger::log(
                $user,
                ActivityAction::ProfileUpdated,
                'Account details were updated by an administrator.',
                $actor,
                ['changes' => $profileChanges],
            );
        }

        if ($originalRoleName !== $nextRole->name) {
            RoleAssigner::assign($user, $nextRole->name);

            ActivityLogger::log(
                $user,
                ActivityAction::RoleUpdated,
                sprintf('Role changed from %s to %s.', $originalRoleLabel, $nextRole->displayLabel()),
                $actor,
                [
                    'from' => $originalRoleName,
                    'to' => $nextRole->name,
                ],
            );
        }

        return to_route('admin.users.show', $user)->with('success', 'User information updated successfully.');
    }

    /**
     * @return array{
     *     managedUser: array<string, mixed>,
     *     activities: Collection<int, array<string, mixed>>,
     *     canManageAdmins: bool,
     *     roles?: list<array{value: string, label: string}>
     * }
     */
    private function userPageProps(Request $request, User $user, bool $includeRoles = false): array
    {
        $user->load(['roles', 'activityLogs.actor']);

        $lastLogin = $user->activityLogs
            ->first(fn ($log) => $log->action === ActivityAction::LoggedIn);

        $props = [
            'managedUser' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'company_name' => $user->company_name,
                'role' => $user->role?->value,
                'role_name' => $user->assignedRoleName(),
                'role_label' => $user->role_label,
                'permissions' => $user->getAllPermissions()->pluck('name')->values()->all(),
                'email_verified' => $user->email_verified_at !== null,
                'two_factor_enabled' => $user->two_factor_confirmed_at !== null,
                'created_at' => $user->created_at?->timezone(config('app.timezone'))->toDayDateTimeString(),
                'updated_at' => $user->updated_at?->timezone(config('app.timezone'))->toDayDateTimeString(),
                'last_login_at' => $lastLogin?->created_at?->timezone(config('app.timezone'))->toDayDateTimeString(),
                'is_self' => $user->id === $request->user()?->id,
                'can_edit' => ! ($user->isSuperAdmin() && ! $request->user()?->canManageAdmins()),
            ],
            'activities' => $user->activityLogs
                ->take(50)
                ->map(fn ($log) => [
                    'id' => $log->id,
                    'action' => $log->action->value,
                    'action_label' => $log->action->label(),
                    'description' => $log->description,
                    'actor_name' => $log->actor?->name,
                    'created_at' => $log->created_at?->timezone(config('app.timezone'))->diffForHumans(),
                    'properties' => $log->properties,
                ])
                ->values(),
            'canManageAdmins' => $request->user()?->canManageAdmins() === true,
        ];

        if ($includeRoles) {
            $props['roles'] = $this->roleOptions();
        }

        return $props;
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    private function roleOptions(): array
    {
        return Role::query()
            ->web()
            ->orderBy('is_system', 'desc')
            ->orderBy('id')
            ->get()
            ->map(fn (Role $role) => [
                'value' => $role->name,
                'label' => $role->displayLabel(),
            ])
            ->values()
            ->all();
    }
}
