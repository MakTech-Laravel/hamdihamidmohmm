<?php

namespace App\Support;

use App\Models\Role;
use App\Models\User;

class EmployerAssignableRoles
{
    /**
     * Employer team invites only use roles this owner created (not system Manager/Interviewer).
     *
     * @return list<array{value: string, label: string}>
     */
    public static function options(User $owner): array
    {
        return Role::query()
            ->web()
            ->forEmployer($owner)
            ->orderBy('label')
            ->get()
            ->map(fn (Role $role): array => [
                'value' => $role->name,
                'label' => $role->displayLabel(),
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<string>
     */
    public static function names(User $owner): array
    {
        return collect(self::options($owner))->pluck('value')->all();
    }
}
