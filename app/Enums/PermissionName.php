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

    public function description(): string
    {
        return match ($this) {
            self::AccessAdminPanel => 'Sign in and use the admin portal.',
            self::ManageAdmins => 'Create and manage administrator accounts.',
            self::ManageUsers => 'View and update job seekers, employers, and roles.',
            self::ManageEmployers => 'Review and manage employer accounts.',
            self::ManageJobSeekers => 'Review and manage job seeker accounts.',
            self::ManageJobs => 'Moderate job posts and listings.',
            self::ManagePackages => 'Manage pricing packages and plans.',
            self::ManagePayments => 'View payments and revenue records.',
            self::ManageVerification => 'Approve or reject verification requests.',
            self::ViewAnalytics => 'Open reports and analytics.',
            self::ManageCms => 'Update website content and pages.',
            self::ManageSettings => 'Change platform settings.',
        };
    }

    public function group(): string
    {
        return match ($this) {
            self::AccessAdminPanel, self::ManageAdmins, self::ManageUsers => 'Access & people',
            self::ManageEmployers, self::ManageJobSeekers => 'Directory',
            self::ManageJobs, self::ManagePackages, self::ManagePayments, self::ManageVerification => 'Operations',
            self::ViewAnalytics, self::ManageCms, self::ManageSettings => 'Platform',
        };
    }

    public function isRequiredForAdmin(): bool
    {
        return $this === self::AccessAdminPanel;
    }

    /**
     * @return list<string>
     */
    public static function groupOrder(): array
    {
        return [
            'Access & people',
            'Directory',
            'Operations',
            'Platform',
        ];
    }

    /**
     * @return list<array{name: string, permissions: list<array{name: string, label: string, description: string, required_for_admin: bool}>}>
     */
    public static function inertiaGroups(): array
    {
        return collect(self::groupOrder())
            ->map(fn (string $group) => [
                'name' => $group,
                'permissions' => collect(self::cases())
                    ->filter(fn (self $permission) => $permission->group() === $group)
                    ->map(fn (self $permission) => [
                        'name' => $permission->value,
                        'label' => $permission->label(),
                        'description' => $permission->description(),
                        'required_for_admin' => $permission->isRequiredForAdmin(),
                    ])
                    ->values()
                    ->all(),
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<self>
     */
    public static function matrixPermissions(): array
    {
        return self::cases();
    }
}
