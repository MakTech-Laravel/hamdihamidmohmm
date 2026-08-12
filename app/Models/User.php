<?php

namespace App\Models;

use App\Enums\PermissionName;
use App\Enums\RoleName;
use App\Enums\UserRole;
use App\Support\RoleAssigner;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'company_name',
        'email',
        'avatar',
        'password',
        'role',
        'created_at',
        'updated_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<string, mixed>
     */
    protected $appends = [
        'avatar_url',
        'role_label',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'role' => UserRole::class,
        ];
    }

    protected function name(): Attribute
    {
        return Attribute::make(
            get: function ($value, array $attributes) {
                $storedName = $attributes['name'] ?? $value;

                if (! empty($storedName)) {
                    return $storedName;
                }

                $composed = trim(($attributes['first_name'] ?? '').' '.($attributes['last_name'] ?? ''));

                return $composed !== '' ? $composed : ($attributes['email'] ?? '');
            },
        );
    }

    public function getFullNameAttribute(): string
    {
        return $this->name;
    }

    public function getRoleLabelAttribute(): string
    {
        return $this->primaryRoleName()?->label()
            ?? $this->role?->label()
            ?? 'Unknown';
    }

    public function primaryRoleName(): ?RoleName
    {
        $spatieRole = $this->getRoleNames()->first();

        if (is_string($spatieRole) && RoleName::tryFrom($spatieRole) instanceof RoleName) {
            return RoleName::from($spatieRole);
        }

        return $this->role?->toRoleName();
    }

    public function assignAppRole(UserRole|RoleName|string $role): self
    {
        return RoleAssigner::assign($this, $role);
    }

    public function isSuperAdmin(): bool
    {
        return $this->hasRole(RoleName::SuperAdmin->value)
            || $this->role === UserRole::SuperAdmin;
    }

    public function isAdmin(): bool
    {
        return $this->hasAnyRole(RoleName::adminPanelValues())
            || $this->role?->isAdmin() === true;
    }

    public function isJobSeeker(): bool
    {
        return $this->hasRole(RoleName::JobSeeker->value)
            || $this->role === UserRole::JobSeeker;
    }

    public function isEmployer(): bool
    {
        return $this->hasRole(RoleName::Employer->value)
            || $this->role === UserRole::Employer;
    }

    public function isUser(): bool
    {
        return $this->isJobSeeker();
    }

    public function canManageUsers(): bool
    {
        return $this->can(PermissionName::ManageUsers->value)
            || $this->isAdmin();
    }

    public function canManageAdmins(): bool
    {
        return $this->isSuperAdmin();
    }

    public function getCanManageUsersAttribute(): bool
    {
        return $this->canManageUsers();
    }

    public function getCanManageAdminsAttribute(): bool
    {
        return $this->canManageAdmins();
    }

    public function canAccessPayroll(): bool
    {
        return $this->isAdmin();
    }

    public function dashboardRoute(): string
    {
        return $this->primaryRoleName()?->dashboardRoute()
            ?? $this->role?->dashboardRoute()
            ?? 'job-seeker.dashboard';
    }

    public function getAvatarUrlAttribute(): ?string
    {
        if ($this->avatar_urls && isset($this->avatar_urls['url'])) {
            return str_replace('%s', 'medium', $this->avatar_urls['url']);
        }

        if ($this->avatar) {
            return asset('storage/'.$this->avatar);
        }

        return null;
    }
}
