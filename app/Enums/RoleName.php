<?php

namespace App\Enums;

enum RoleName: string
{
    case SuperAdmin = 'super-admin';
    case Admin = 'admin';
    case JobSeeker = 'job-seeker';
    case Employer = 'employer';
    case EmployerManager = 'employer-manager';
    case EmployerInterviewer = 'employer-interviewer';

    public function label(): string
    {
        return match ($this) {
            self::SuperAdmin => 'Super Admin',
            self::Admin => 'Admin',
            self::JobSeeker => 'Job Seeker',
            self::Employer => 'Employer Owner',
            self::EmployerManager => 'Manager',
            self::EmployerInterviewer => 'Interviewer',
        };
    }

    public function dashboardRoute(): string
    {
        return match ($this) {
            self::SuperAdmin, self::Admin => 'admin.dashboard',
            self::Employer, self::EmployerManager, self::EmployerInterviewer => 'employer.dashboard',
            self::JobSeeker => 'job-seeker.dashboard',
        };
    }

    public function isAdminPanelRole(): bool
    {
        return $this === self::SuperAdmin || $this === self::Admin;
    }

    public function isEmployerPortalRole(): bool
    {
        return in_array($this, [
            self::Employer,
            self::EmployerManager,
            self::EmployerInterviewer,
        ], true);
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
    public static function employerPortalValues(): array
    {
        return [
            self::Employer->value,
            self::EmployerManager->value,
            self::EmployerInterviewer->value,
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
