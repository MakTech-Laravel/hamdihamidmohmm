<?php

namespace App\Support;

use App\Enums\RoleName;
use App\Enums\UserRole;
use App\Models\Role;
use App\Models\User;

class RoleAssigner
{
    public static function assign(User $user, UserRole|RoleName|string $role): User
    {
        $roleModel = self::resolve($role);

        $user->forceFill([
            'role' => self::userRoleFor($roleModel),
        ])->save();

        $user->syncRoles([$roleModel->name]);

        return $user->refresh();
    }

    public static function resolve(UserRole|RoleName|string $role): Role
    {
        $name = match (true) {
            $role instanceof UserRole => $role->spatieName(),
            $role instanceof RoleName => $role->value,
            default => $role,
        };

        return Role::findByName($name, 'web');
    }

    public static function userRoleFor(Role $role): UserRole
    {
        $roleName = RoleName::tryFrom($role->name);

        if ($roleName instanceof RoleName) {
            return UserRole::fromRoleName($roleName);
        }

        return UserRole::Admin;
    }
}
