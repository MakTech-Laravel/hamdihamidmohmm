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

    case AccessEmployerPortal = 'access employer portal';
    case EmployerDashboard = 'employer.dashboard';
    case EmployerJobs = 'employer.jobs';
    case EmployerApplications = 'employer.applications';
    case EmployerReports = 'employer.reports';
    case EmployerNotifications = 'employer.notifications';
    case EmployerProfile = 'employer.profile';
    case EmployerPackages = 'employer.packages';
    case EmployerSettings = 'employer.settings';
    case EmployerTeam = 'employer.team';

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
            self::AccessEmployerPortal => 'Access Employer Portal',
            self::EmployerDashboard => 'Employer Dashboard',
            self::EmployerJobs => 'Employer Jobs',
            self::EmployerApplications => 'Employer Applications',
            self::EmployerReports => 'Employer Reports',
            self::EmployerNotifications => 'Employer Notifications',
            self::EmployerProfile => 'Employer Profile',
            self::EmployerPackages => 'Employer Packages',
            self::EmployerSettings => 'Employer Settings',
            self::EmployerTeam => 'Employer Team',
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
            self::AccessEmployerPortal => 'Sign in and use the employer portal.',
            self::EmployerDashboard => 'Open the employer dashboard.',
            self::EmployerJobs => 'View and manage job vacancies.',
            self::EmployerApplications => 'Review applications and roster.',
            self::EmployerReports => 'Open per-job hiring reports.',
            self::EmployerNotifications => 'View employer notifications.',
            self::EmployerProfile => 'Edit the organization profile.',
            self::EmployerPackages => 'Manage packages and billing.',
            self::EmployerSettings => 'Change employer account settings.',
            self::EmployerTeam => 'Invite and manage employer team members.',
        };
    }

    public function group(): string
    {
        return match ($this) {
            self::AccessAdminPanel, self::ManageAdmins, self::ManageUsers => 'Access & people',
            self::ManageEmployers, self::ManageJobSeekers => 'Directory',
            self::ManageJobs, self::ManagePackages, self::ManagePayments, self::ManageVerification => 'Operations',
            self::ViewAnalytics, self::ManageCms, self::ManageSettings => 'Platform',
            self::AccessEmployerPortal,
            self::EmployerDashboard,
            self::EmployerJobs,
            self::EmployerApplications,
            self::EmployerReports,
            self::EmployerNotifications,
            self::EmployerProfile,
            self::EmployerPackages,
            self::EmployerSettings,
            self::EmployerTeam => 'Employer portal',
        };
    }

    public function isRequiredForAdmin(): bool
    {
        return $this === self::AccessAdminPanel;
    }

    public function isEmployerPortalPermission(): bool
    {
        return $this->group() === 'Employer portal';
    }

    /**
     * @return list<self>
     */
    public static function employerPortalCases(): array
    {
        return array_values(array_filter(
            self::cases(),
            fn (self $permission): bool => $permission->isEmployerPortalPermission(),
        ));
    }

    /**
     * @return list<string>
     */
    public static function employerOwnerPermissionValues(): array
    {
        return collect(self::employerPortalCases())->map->value->all();
    }

    /**
     * @return list<string>
     */
    public static function employerManagerPermissionValues(): array
    {
        return [
            self::AccessEmployerPortal->value,
            self::EmployerDashboard->value,
            self::EmployerJobs->value,
            self::EmployerApplications->value,
            self::EmployerNotifications->value,
        ];
    }

    /**
     * @return list<string>
     */
    public static function employerInterviewerPermissionValues(): array
    {
        return [
            self::AccessEmployerPortal->value,
            self::EmployerApplications->value,
            self::EmployerNotifications->value,
        ];
    }

    /**
     * Permissions an employer owner may put on custom panel roles.
     *
     * @return list<string>
     */
    public static function employerDelegatablePermissionValues(): array
    {
        $ownerOnly = [
            self::EmployerTeam->value,
            self::EmployerPackages->value,
            self::EmployerSettings->value,
        ];

        return collect(self::employerOwnerPermissionValues())
            ->reject(fn (string $permission): bool => in_array($permission, $ownerOnly, true))
            ->values()
            ->all();
    }

    /**
     * @return list<array{name: string, permissions: list<array{name: string, label: string, description: string, required_for_admin: bool}>}>
     */
    public static function employerDelegatableInertiaGroups(): array
    {
        $allowed = self::employerDelegatablePermissionValues();

        return collect(self::inertiaGroups())
            ->map(fn (array $group): array => [
                'name' => $group['name'],
                'permissions' => collect($group['permissions'])
                    ->filter(fn (array $permission): bool => in_array($permission['name'], $allowed, true))
                    ->map(fn (array $permission): array => [
                        ...$permission,
                        'required_for_admin' => $permission['name'] === self::AccessEmployerPortal->value,
                    ])
                    ->values()
                    ->all(),
            ])
            ->filter(fn (array $group): bool => $group['permissions'] !== [])
            ->values()
            ->all();
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
            'Employer portal',
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
