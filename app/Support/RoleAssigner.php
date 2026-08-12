<?php

namespace App\Support;

use App\Enums\RoleName;
use App\Enums\UserRole;
use App\Models\User;
use Spatie\Permission\Models\Role;

class RoleAssigner
{
    public static function assign(User $user, UserRole|RoleName|string $role): User
    {
        $userRole = match (true) {
            $role instanceof UserRole => $role,
            $role instanceof RoleName => UserRole::fromRoleName($role),
            default => UserRole::fromRoleName(RoleName::from($role)),
        };

        $roleName = $userRole->spatieName();

        Role::findOrCreate($roleName, 'web');

        $user->forceFill([
            'role' => $userRole,
        ])->save();

        $user->syncRoles([$roleName]);

        return $user->refresh();
    }
}
