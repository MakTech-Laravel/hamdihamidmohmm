<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Enums\PermissionName;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\StoreManagedRoleRequest;
use App\Http\Requests\Backend\Admin\UpdateManagedRoleRequest;
use App\Models\Role;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->canManageUsers(), 403);

        $roles = $this->roleModels();

        return Inertia::render('backend/Admin/RolePermissions', [
            'roles' => $roles->map(fn (Role $role) => $this->roleCard($role))->values(),
            'permissionMatrix' => $this->permissionMatrix($roles),
            'permissionGroups' => PermissionName::inertiaGroups(),
            'canManageAdmins' => $request->user()?->canManageAdmins() === true,
        ]);
    }

    public function create(Request $request): Response
    {
        abort_unless($request->user()?->canManageAdmins(), 403);

        return Inertia::render('backend/Admin/RoleCreate', [
            'permissionGroups' => PermissionName::inertiaGroups(),
            'defaultPermissions' => [PermissionName::AccessAdminPanel->value],
        ]);
    }

    public function store(StoreManagedRoleRequest $request): RedirectResponse
    {
        $role = Role::query()->create([
            'name' => $this->uniqueRoleName($request->string('label')->toString()),
            'guard_name' => 'web',
            'label' => $request->string('label')->toString(),
            'description' => $request->filled('description')
                ? $request->string('description')->toString()
                : null,
            'is_system' => false,
            'is_locked' => false,
        ]);

        $this->syncPermissions($role, $request->input('permissions', []));

        return to_route('admin.roles-permissions.show', $role)
            ->with('success', 'Role created successfully.');
    }

    public function show(Request $request, Role $role): Response
    {
        abort_unless($request->user()?->canManageUsers(), 403);

        $role->load('permissions');
        $role->loadCount('users');

        return Inertia::render('backend/Admin/RoleShow', [
            'managedRole' => $this->roleCard($role),
            'permissionGroups' => PermissionName::inertiaGroups(),
            'canManageAdmins' => $request->user()?->canManageAdmins() === true,
        ]);
    }

    public function edit(Request $request, Role $role): Response
    {
        abort_unless($request->user()?->canManageAdmins(), 403);
        abort_if($role->isLocked(), 403, 'Super Admin permissions cannot be changed.');

        $role->load('permissions');
        $role->loadCount('users');

        return Inertia::render('backend/Admin/RoleEdit', [
            'managedRole' => $this->roleCard($role),
            'permissionGroups' => PermissionName::inertiaGroups(),
        ]);
    }

    public function update(UpdateManagedRoleRequest $request, Role $role): RedirectResponse
    {
        $role->forceFill([
            'label' => $request->string('label')->toString(),
            'description' => $request->filled('description')
                ? $request->string('description')->toString()
                : null,
        ])->save();

        $this->syncPermissions($role, $request->input('permissions', []));

        return to_route('admin.roles-permissions.show', $role)
            ->with('success', 'Role updated successfully.');
    }

    public function destroy(Request $request, Role $role): RedirectResponse
    {
        abort_unless($request->user()?->canManageAdmins(), 403);
        abort_unless($role->canBeDeleted(), 403, 'This role cannot be deleted.');

        $role->syncPermissions([]);
        $role->delete();
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return to_route('admin.roles-permissions.index')
            ->with('success', 'Role deleted successfully.');
    }

    /**
     * @return Collection<int, Role>
     */
    private function roleModels()
    {
        return Role::query()
            ->web()
            ->with('permissions')
            ->withCount('users')
            ->orderBy('is_system', 'desc')
            ->orderBy('id')
            ->get();
    }

    /**
     * @return array{
     *     id: int,
     *     value: string,
     *     label: string,
     *     description: string|null,
     *     users_count: int,
     *     permissions: list<string>,
     *     permissions_count: int,
     *     editable: bool,
     *     locked: bool,
     *     is_system: bool,
     *     can_delete: bool,
     *     kind: string
     * }
     */
    private function roleCard(Role $role): array
    {
        return [
            'id' => $role->id,
            'value' => $role->name,
            'label' => $role->displayLabel(),
            'description' => $role->description,
            'users_count' => (int) ($role->users_count ?? $role->users()->count()),
            'permissions' => $role->permissionNames(),
            'permissions_count' => $role->permissions->count(),
            'editable' => ! $role->isLocked(),
            'locked' => $role->isLocked(),
            'is_system' => $role->isSystemRole(),
            'can_delete' => $role->canBeDeleted(),
            'kind' => $role->isPortalRole() ? 'portal' : 'admin-panel',
        ];
    }

    /**
     * @param  Collection<int, Role>  $roles
     * @return list<array{name: string, label: string, group: string, roles: array<string, bool>}>
     */
    private function permissionMatrix($roles): array
    {
        return collect(PermissionName::matrixPermissions())->map(function (PermissionName $permission) use ($roles) {
            return [
                'name' => $permission->value,
                'label' => $permission->label(),
                'group' => $permission->group(),
                'roles' => $roles
                    ->mapWithKeys(fn (Role $role) => [
                        $role->name => $role->hasPermissionTo($permission->value),
                    ])
                    ->all(),
            ];
        })->values()->all();
    }

    /**
     * @param  list<mixed>  $permissions
     */
    private function syncPermissions(Role $role, array $permissions): void
    {
        $names = collect(Role::syncablePermissions($role, $permissions))
            ->filter(fn ($permission) => Permission::query()->where('name', $permission)->exists())
            ->values()
            ->all();

        $role->syncPermissions($names);
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    private function uniqueRoleName(string $label): string
    {
        $base = Str::slug($label);
        $base = $base !== '' ? $base : 'role';
        $name = $base;
        $suffix = 2;

        while (Role::query()->web()->where('name', $name)->exists()) {
            $name = $base.'-'.$suffix;
            $suffix++;
        }

        return $name;
    }
}
