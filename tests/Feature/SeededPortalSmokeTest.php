<?php

use App\Models\User;
use Database\Seeders\AdminSeeder;
use Database\Seeders\UserSeeder;

beforeEach(function () {
    $this->seed(AdminSeeder::class);
    $this->seed(UserSeeder::class);
});

test('seeded employer can open all employer portal pages', function () {
    $employer = User::query()->where('email', 'employer@dev.com')->firstOrFail();

    $this->actingAs($employer);

    foreach (
        [
            'employer.dashboard' => 'backend/User/EmployerDashboard',
            'employer.profile' => 'backend/User/EmployerCompanyProfile',
            'employer.packages' => 'backend/User/EmployerPackages',
            'employer.jobs' => 'backend/User/EmployerJobs',
            'employer.applications' => 'backend/User/EmployerApplications',
            'employer.notifications' => 'backend/User/EmployerNotifications',
            'employer.settings' => 'backend/User/EmployerSettings',
        ] as $route => $component
    ) {
        $this->get(route($route))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component($component));
    }
});

test('seeded job seeker can open all job seeker portal pages', function () {
    $seeker = User::query()->where('email', 'seeker@dev.com')->firstOrFail();

    $this->actingAs($seeker);

    foreach (
        [
            'job-seeker.dashboard' => 'backend/User/JobSeekerDashboard',
            'job-seeker.profile' => 'backend/User/JobSeekerProfile',
            'job-seeker.applications' => 'backend/User/JobSeekerApplications',
            'job-seeker.notifications' => 'backend/User/JobSeekerNotifications',
            'job-seeker.settings' => 'backend/User/JobSeekerSettings',
        ] as $route => $component
    ) {
        $this->get(route($route))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component($component));
    }
});

test('seeded admin can open key admin portal pages', function () {
    $admin = User::query()->where('email', 'admin@dev.com')->firstOrFail();

    $this->actingAs($admin);

    foreach (
        [
            'admin.dashboard' => 'backend/Admin/AdminDashboard',
            'admin.verifications.index' => 'backend/Admin/VerificationCenter',
            'admin.notifications.index' => 'backend/Admin/AdminNotifications',
            'admin.employers.index' => 'backend/Admin/EmployerManagement',
            'admin.job-seekers.index' => 'backend/Admin/JobSeekerManagement',
            'admin.jobs.index' => 'backend/Admin/JobManagement',
            'admin.applications.index' => 'backend/Admin/ApplicationsMonitoring',
            'admin.packages.index' => 'backend/Admin/PackagesPricing',
            'admin.payments.index' => 'backend/Admin/PaymentsRevenue',
            'admin.settings.index' => 'backend/Admin/PlatformSettings',
        ] as $route => $component
    ) {
        $this->get(route($route))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component($component));
    }
});
