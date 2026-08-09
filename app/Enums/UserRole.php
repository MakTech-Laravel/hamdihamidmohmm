<?php

namespace App\Enums;

enum UserRole: int
{
    case Admin = 1;
    case JobSeeker = 2;
    case Employer = 3;

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Admin',
            self::JobSeeker => 'Job Seeker',
            self::Employer => 'Employer',
        };
    }

    public function isAdmin(): bool
    {
        return $this === self::Admin;
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

    public function canAccessPayroll(): bool
    {
        return $this->isAdmin();
    }

    public function dashboardRoute(): string
    {
        return match ($this) {
            self::Employer => 'employer.dashboard',
            default => 'job-seeker.dashboard',
        };
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
}
