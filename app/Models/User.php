<?php

namespace App\Models;

use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

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
     * @var array<int, string>
     */
    protected $appends = [
        'avatar_url',
        'role_label',
    ];

    /**
     * Get the attributes that should be cast.
     *
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
        return $this->role?->label() ?? 'Unknown';
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }

    public function isJobSeeker(): bool
    {
        return $this->role === UserRole::JobSeeker;
    }

    public function isEmployer(): bool
    {
        return $this->role === UserRole::Employer;
    }

    public function isUser(): bool
    {
        return $this->isJobSeeker();
    }

    public function canManageUsers(): bool
    {
        return $this->isAdmin();
    }

    public function getCanManageUsersAttribute(): bool
    {
        return $this->canManageUsers();
    }

    public function canAccessPayroll(): bool
    {
        return $this->role?->canAccessPayroll() ?? false;
    }

    public function dashboardRoute(): string
    {
        return $this->role?->dashboardRoute() ?? 'job-seeker.dashboard';
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
