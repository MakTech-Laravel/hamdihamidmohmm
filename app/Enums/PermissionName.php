<?php

namespace App\Enums;

enum PermissionName: string
{
    case AccessAdminPanel = 'access admin panel';
    case ManageAdmins = 'manage admins';
    case ManageUsers = 'manage users';
    case ManageEmployers = 'manage employers';
    case ManageJobSeekers = 'manage job seekers';
    case ManageJobs = 'manage jobs';
    case ManagePackages = 'manage packages';
    case ManagePayments = 'manage payments';
    case ManageVerification = 'manage verification';
    case ViewAnalytics = 'view analytics';
    case ManageCms = 'manage cms';
    case ManageSettings = 'manage settings';

    public function label(): string
    {
        return match ($this) {
            self::AccessAdminPanel => 'Access Admin Panel',
            self::ManageAdmins => 'Manage Admins',
            self::ManageUsers => 'Manage Users',
            self::ManageEmployers => 'Employers',
            self::ManageJobSeekers => 'Job Seekers',
            self::ManageJobs => 'Jobs',
            self::ManagePackages => 'Packages',
            self::ManagePayments => 'Payments',
            self::ManageVerification => 'Verification',
            self::ViewAnalytics => 'Reports',
            self::ManageCms => 'CMS',
            self::ManageSettings => 'Settings',
        };
    }

    /**
     * @return list<self>
     */
    public static function matrixPermissions(): array
    {
        return [
            self::ManageEmployers,
            self::ManageJobSeekers,
            self::ManageJobs,
            self::ManagePackages,
            self::ManagePayments,
            self::ManageVerification,
            self::ViewAnalytics,
            self::ManageCms,
            self::ManageSettings,
        ];
    }
}
