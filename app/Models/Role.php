<?php

namespace App\Models;

use App\Enums\PermissionName;
use App\Enums\RoleName;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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
        'employer_owner_id',
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

    /**
     * @return BelongsTo<User, $this>
     */
    public function employerOwner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employer_owner_id');
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

    public function isEmployerScoped(): bool
    {
        return $this->employer_owner_id !== null;
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
        if ($this->isEmployerScoped()) {
            return true;
        }

        return in_array($this->name, [
            RoleName::JobSeeker->value,
            ...RoleName::employerPortalValues(),
        ], true);
    }

    public function requiresAdminPanelAccess(): bool
    {
        return ! $this->isPortalRole() && ! $this->isLocked() && ! $this->isEmployerScoped();
    }

    public function canBeDeleted(): bool
    {
        if ($this->isLocked()) {
            return false;
        }

        if ($this->isEmployerScoped()) {
            return $this->users()->count() === 0;
        }

        return ! $this->isSystemRole() && $this->users()->count() === 0;
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
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopePlatform(Builder $query): Builder
    {
        return $query->whereNull('employer_owner_id');
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeForEmployer(Builder $query, User $owner): Builder
    {
        return $query->where('employer_owner_id', $owner->id);
    }

    /**
     * @param  list<mixed>  $permissions
     * @return list<string>
     */
    public static function syncablePermissions(self $role, array $permissions): array
    {
        $names = collect($permissions)
            ->filter(fn ($permission) => is_string($permission) && $permission !== '')
            ->unique()
            ->values();

        if ($role->isEmployerScoped()) {
            $allowed = collect(PermissionName::employerDelegatablePermissionValues());
            $names = $names->intersect($allowed)->values();
            $names->push(PermissionName::AccessEmployerPortal->value);

            return $names->unique()->values()->all();
        }

        if ($role->requiresAdminPanelAccess()) {
            $names->push(PermissionName::AccessAdminPanel->value);
        }

        if ($role->isPortalRole() && in_array($role->name, RoleName::employerPortalValues(), true)) {
            $names->push(PermissionName::AccessEmployerPortal->value);
        }

        if ($role->isLocked()) {
            return collect(PermissionName::cases())->map->value->all();
        }

        return $names->unique()->values()->all();
    }
}
