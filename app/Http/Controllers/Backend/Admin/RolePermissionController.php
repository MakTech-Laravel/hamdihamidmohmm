<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Enums\PermissionName;
use App\Enums\RoleName;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\UpdateRolePermissionsRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->canManageUsers(), 403);

        $roles = collect([
            RoleName::SuperAdmin,
            RoleName::Admin,
            RoleName::JobSeeker,
            RoleName::Employer,
        ])->map(function (RoleName $roleName) {
            $role = Role::findByName($roleName->value, 'web');

            return [
                'value' => $roleName->value,
                'label' => $roleName->label(),
                'users_count' => $role->users()->count(),
                'permissions' => $role->permissions->pluck('name')->values()->all(),
                'permissions_count' => $role->permissions->count(),
            ];
        })->values();

        $permissionMatrix = collect(PermissionName::matrixPermissions())->map(function (PermissionName $permission) {
            return [
                'name' => $permission->value,
                'label' => $permission->label(),
                'roles' => [
                    RoleName::SuperAdmin->value => Role::findByName(RoleName::SuperAdmin->value, 'web')->hasPermissionTo($permission->value),
                    RoleName::Admin->value => Role::findByName(RoleName::Admin->value, 'web')->hasPermissionTo($permission->value),
                    RoleName::JobSeeker->value => Role::findByName(RoleName::JobSeeker->value, 'web')->hasPermissionTo($permission->value),
                    RoleName::Employer->value => Role::findByName(RoleName::Employer->value, 'web')->hasPermissionTo($permission->value),
                ],
            ];
        })->values();

        $allPermissions = collect(PermissionName::cases())
            ->map(fn (PermissionName $permission) => [
                'name' => $permission->value,
                'label' => $permission->label(),
            ])
            ->values();

        return Inertia::render('backend/Admin/RolePermissions', [
            'roles' => $roles,
            'permissionMatrix' => $permissionMatrix,
            'allPermissions' => $allPermissions,
            'adminPermissions' => Role::findByName(RoleName::Admin->value, 'web')
                ->permissions
                ->pluck('name')
                ->values()
                ->all(),
            'canManageAdmins' => $request->user()?->canManageAdmins() === true,
        ]);
    }

    public function update(UpdateRolePermissionsRequest $request): RedirectResponse
    {
        $roleName = $request->string('role')->toString();

        abort_if($roleName === RoleName::SuperAdmin->value, 403, 'Super Admin permissions cannot be reduced.');

        $role = Role::findByName($roleName, 'web');
        $permissions = collect($request->input('permissions', []))
            ->filter(fn ($permission) => Permission::query()->where('name', $permission)->exists())
            ->values()
            ->all();

        $role->syncPermissions($permissions);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return back()->with('success', 'Role permissions updated successfully.');
    }
}
