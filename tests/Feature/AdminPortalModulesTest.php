<?php

use App\Models\User;

test('admins can view designed admin portal modules', function (string $route, string $component) {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route($route))
        ->assertOk()
        ->assertInertia(fn($page) => $page->component($component));
})->with([
    ['admin.employers.index', 'backend/Admin/EmployerManagement'],
    ['admin.job-seekers.index', 'backend/Admin/JobSeekerManagement'],
    ['admin.jobs.index', 'backend/Admin/JobManagement'],
    ['admin.applications.index', 'backend/Admin/ApplicationsMonitoring'],
    ['admin.packages.index', 'backend/Admin/PackagesPricing'],
    ['admin.payments.index', 'backend/Admin/PaymentsRevenue'],
    ['admin.verifications.index', 'backend/Admin/VerificationCenter'],
    ['admin.reports.index', 'backend/Admin/ReportsAnalytics'],
    ['admin.content.index', 'backend/Admin/ContentManagement'],
    ['admin.notifications.index', 'backend/Admin/AdminNotifications'],
    ['admin.settings.index', 'backend/Admin/PlatformSettings'],
]);

test('job seekers cannot view admin portal modules', function () {
    $seeker = User::factory()->jobSeeker()->create();

    $this->actingAs($seeker)
        ->get(route('admin.employers.index'))
        ->assertRedirect(route('job-seeker.dashboard'));
});
