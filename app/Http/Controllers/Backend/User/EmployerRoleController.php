<?php

namespace App\Http\Controllers\Backend\User;

use App\Enums\PermissionName;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\User\StoreEmployerRoleRequest;
use App\Http\Requests\Backend\User\UpdateEmployerRoleRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class EmployerRoleController extends Controller
{
    public function index(Request $request): Response
    {
        $owner = $this->authorizeOwner($request);

        $roles = Role::query()
            ->web()
            ->forEmployer($owner)
            ->with('permissions')
            ->withCount('users')
            ->orderBy('label')
            ->orderBy('id')
            ->get()
            ->map(fn (Role $role): array => $this->roleCard($role))
            ->values();

        return Inertia::render('backend/User/EmployerRoles', [
            'roles' => $roles,
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorizeOwner($request);

        return Inertia::render('backend/User/EmployerRoleForm', [
            'role' => null,
            'permissionGroups' => PermissionName::employerDelegatableInertiaGroups(),
            'defaultPermissions' => [PermissionName::AccessEmployerPortal->value],
        ]);
    }

    public function store(StoreEmployerRoleRequest $request): RedirectResponse
    {
        $owner = $this->authorizeOwner($request);
        $label = $request->string('label')->toString();

        $role = Role::query()->create([
            'name' => $this->uniqueRoleName($owner, $label),
            'guard_name' => 'web',
            'label' => $label,
            'description' => $request->filled('description')
                ? $request->string('description')->toString()
                : null,
            'is_system' => false,
            'is_locked' => false,
            'employer_owner_id' => $owner->id,
        ]);

        $this->syncPermissions($role, $request->input('permissions', []));

        return redirect()
            ->route('employer.roles')
            ->with('success', 'Role created.');
    }

    public function edit(Request $request, Role $role): Response
    {
        $owner = $this->authorizeOwner($request);
        $this->ensureOwnedRole($owner, $role);

        $role->load('permissions');
        $role->loadCount('users');

        return Inertia::render('backend/User/EmployerRoleForm', [
            'role' => $this->roleCard($role),
            'permissionGroups' => PermissionName::employerDelegatableInertiaGroups(),
            'defaultPermissions' => $role->permissionNames(),
        ]);
    }

    public function update(UpdateEmployerRoleRequest $request, Role $role): RedirectResponse
    {
        $owner = $this->authorizeOwner($request);
        $this->ensureOwnedRole($owner, $role);

        $role->forceFill([
            'label' => $request->string('label')->toString(),
            'description' => $request->filled('description')
                ? $request->string('description')->toString()
                : null,
        ])->save();

        $this->syncPermissions($role, $request->input('permissions', []));

        return redirect()
            ->route('employer.roles')
            ->with('success', 'Role updated.');
    }

    public function destroy(Request $request, Role $role): RedirectResponse
    {
        $owner = $this->authorizeOwner($request);
        $this->ensureOwnedRole($owner, $role);
        abort_unless($role->canBeDeleted(), 403, 'This role cannot be deleted while users are assigned.');

        $role->syncPermissions([]);
        $role->delete();
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return redirect()
            ->route('employer.roles')
            ->with('success', 'Role deleted.');
    }

    private function authorizeOwner(Request $request): User
    {
        $owner = $request->user();

        abort_unless(
            $owner?->isEmployerOwner() === true
            && $owner->can(PermissionName::EmployerTeam->value),
            403,
        );

        return $owner;
    }

    private function ensureOwnedRole(User $owner, Role $role): void
    {
        abort_unless(
            $role->isEmployerScoped()
            && (int) $role->employer_owner_id === (int) $owner->id,
            404,
        );
    }

    /**
     * @return array{
     *     id: int,
     *     value: string,
     *     label: string,
     *     description: string|null,
     *     users_count: int,
     *     permissions: list<string>,
     *     can_delete: bool
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
            'can_delete' => $role->canBeDeleted(),
        ];
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

    private function uniqueRoleName(User $owner, string $label): string
    {
        $slug = Str::slug($label);
        $slug = $slug !== '' ? $slug : 'role';
        $base = 'emp-'.$owner->id.'-'.$slug;
        $name = $base;
        $suffix = 2;

        while (Role::query()->web()->where('name', $name)->exists()) {
            $name = $base.'-'.$suffix;
            $suffix++;
        }

        return $name;
    }
}
