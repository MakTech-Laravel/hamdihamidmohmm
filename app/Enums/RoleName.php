<?php

namespace App\Enums;

enum RoleName: string
{
    case SuperAdmin = 'super-admin';
    case Admin = 'admin';
    case JobSeeker = 'job-seeker';
    case Employer = 'employer';

    public function label(): string
    {
        return match ($this) {
            self::SuperAdmin => 'Super Admin',
            self::Admin => 'Admin',
            self::JobSeeker => 'Job Seeker',
            self::Employer => 'Employer',
        };
    }

    public function dashboardRoute(): string
    {
        return match ($this) {
            self::SuperAdmin, self::Admin => 'admin.dashboard',
            self::Employer => 'employer.dashboard',
            self::JobSeeker => 'job-seeker.dashboard',
        };
    }

    public function isAdminPanelRole(): bool
    {
        return $this === self::SuperAdmin || $this === self::Admin;
    }

    /**
     * @return list<string>
     */
    public static function adminPanelValues(): array
    {
        return [
            self::SuperAdmin->value,
            self::Admin->value,
        ];
    }

    /**
     * @return list<string>
     */
    public static function registrableValues(): array
    {
        return [
            self::JobSeeker->value,
            self::Employer->value,
        ];
    }

    public static function fromUserRole(UserRole $role): self
    {
        return match ($role) {
            UserRole::SuperAdmin => self::SuperAdmin,
            UserRole::Admin => self::Admin,
            UserRole::Employer => self::Employer,
            UserRole::JobSeeker => self::JobSeeker,
        };
    }
}
