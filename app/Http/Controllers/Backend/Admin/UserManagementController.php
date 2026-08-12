<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Enums\RoleName;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\UpdateUserRoleRequest;
use App\Models\User;
use App\Support\RoleAssigner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->canManageUsers(), 403);

        $roleFilter = $request->string('role')->toString();

        $usersQuery = User::query()->with('roles')->latest();

        if ($roleFilter !== '' && RoleName::tryFrom($roleFilter) instanceof RoleName) {
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
                'role_name' => $user->primaryRoleName()?->value,
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
            'roles' => collect(RoleName::cases())->map(fn (RoleName $role) => [
                'value' => $role->value,
                'label' => $role->label(),
                'enum' => UserRole::fromRoleName($role)->value,
            ])->values(),
            'canManageAdmins' => $request->user()?->canManageAdmins() === true,
        ]);
    }

    public function updateRole(UpdateUserRoleRequest $request, User $user): RedirectResponse
    {
        abort_if($user->id === $request->user()?->id, 403, 'You cannot change your own role.');

        $nextRole = UserRole::from((int) $request->integer('role'));

        if ($nextRole === UserRole::SuperAdmin && ! $request->user()?->canManageAdmins()) {
            abort(403);
        }

        if ($user->isSuperAdmin() && ! $request->user()?->canManageAdmins()) {
            abort(403);
        }

        RoleAssigner::assign($user, $nextRole);

        return back()->with('success', 'User role updated successfully.');
    }
}
