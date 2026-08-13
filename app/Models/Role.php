<?php

namespace App\Models;

use App\Enums\PermissionName;
use App\Enums\RoleName;
use Illuminate\Database\Eloquent\Builder;
use Spatie\Permission\Models\Role as SpatieRole;

class Role extends SpatieRole
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'guard_name',
        'label',
        'description',
        'is_system',
        'is_locked',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_system' => 'boolean',
            'is_locked' => 'boolean',
        ];
    }

    public function displayLabel(): string
    {
        if (filled($this->label)) {
            return (string) $this->label;
        }

        $roleName = RoleName::tryFrom($this->name);

        if ($roleName instanceof RoleName) {
            return $roleName->label();
        }

        return str($this->name)->replace('-', ' ')->title()->toString();
    }

    public function isSystemRole(): bool
    {
        return $this->is_system || RoleName::tryFrom($this->name) instanceof RoleName;
    }

    public function isLocked(): bool
    {
        return $this->is_locked || $this->name === RoleName::SuperAdmin->value;
    }

    public function isPortalRole(): bool
    {
        return in_array($this->name, [
            RoleName::JobSeeker->value,
            RoleName::Employer->value,
        ], true);
    }

    public function requiresAdminPanelAccess(): bool
    {
        return ! $this->isPortalRole() && ! $this->isLocked();
    }

    public function canBeDeleted(): bool
    {
        return ! $this->isSystemRole() && ! $this->isLocked() && $this->users()->count() === 0;
    }

    /**
     * @return list<string>
     */
    public function permissionNames(): array
    {
        return $this->permissions->pluck('name')->values()->all();
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeWeb(Builder $query): Builder
    {
        return $query->where('guard_name', 'web');
    }

    /**
     * @return list<string>
     */
    public static function syncablePermissions(self $role, array $permissions): array
    {
        $names = collect($permissions)
            ->filter(fn ($permission) => is_string($permission) && $permission !== '')
            ->unique()
            ->values();

        if ($role->requiresAdminPanelAccess()) {
            $names->push(PermissionName::AccessAdminPanel->value);
        }

        if ($role->isLocked()) {
            return collect(PermissionName::cases())->map->value->all();
        }

        return $names->unique()->values()->all();
    }
}
