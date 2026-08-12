<?php

namespace App\Enums;

enum UserRole: int
{
    case SuperAdmin = 0;
    case Admin = 1;
    case JobSeeker = 2;
    case Employer = 3;

    public function label(): string
    {
        return $this->toRoleName()->label();
    }

    public function toRoleName(): RoleName
    {
        return match ($this) {
            self::SuperAdmin => RoleName::SuperAdmin,
            self::Admin => RoleName::Admin,
            self::JobSeeker => RoleName::JobSeeker,
            self::Employer => RoleName::Employer,
        };
    }

    public function spatieName(): string
    {
        return $this->toRoleName()->value;
    }

    public function isSuperAdmin(): bool
    {
        return $this === self::SuperAdmin;
    }

    public function isAdmin(): bool
    {
        return $this === self::Admin || $this === self::SuperAdmin;
    }

    public function isJobSeeker(): bool
    {
        return $this === self::JobSeeker;
    }

    public function isEmployer(): bool
    {
        return $this === self::Employer;
    }

    public function isUser(): bool
    {
        return $this->isJobSeeker();
    }

    public function canManageUsers(): bool
    {
        return $this->isAdmin();
    }

    public function canManageAdmins(): bool
    {
        return $this->isSuperAdmin();
    }

    public function canAccessPayroll(): bool
    {
        return $this->isAdmin();
    }

    public function dashboardRoute(): string
    {
        return $this->toRoleName()->dashboardRoute();
    }

    /**
     * @return list<int>
     */
    public static function registrableValues(): array
    {
        return [
            self::JobSeeker->value,
            self::Employer->value,
        ];
    }

    public static function fromRoleName(RoleName|string $roleName): self
    {
        $name = $roleName instanceof RoleName ? $roleName : RoleName::from($roleName);

        return match ($name) {
            RoleName::SuperAdmin => self::SuperAdmin,
            RoleName::Admin => self::Admin,
            RoleName::JobSeeker => self::JobSeeker,
            RoleName::Employer => self::Employer,
        };
    }
}
