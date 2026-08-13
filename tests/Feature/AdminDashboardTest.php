<?php

use App\Models\User;

test('admins can view the designed admin dashboard', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/Admin/AdminDashboard')
            ->has('stats')
            ->has('recentUsers')
            ->has('alerts'));
});

test('job seekers cannot view the admin dashboard', function () {
    $seeker = User::factory()->jobSeeker()->create();

    $this->actingAs($seeker)
        ->get(route('admin.dashboard'))
        ->assertRedirect(route('job-seeker.dashboard'));
});

test('admin portal ships the figma company logo', function () {
    $path = public_path('images/admin/logo.png');
    $info = getimagesize($path);
    $image = imagecreatefrompng($path);
    $corner = imagecolorsforindex($image, imagecolorat($image, 0, 0));

    expect($path)->toBeFile()
        ->and($info[0])->toBe(152)
        ->and($info[1])->toBe(102)
        ->and($info['mime'])->toBe('image/png')
        ->and($corner['alpha'])->toBe(127);
});

test('admin portal ships figma icon assets', function (string $file) {
    $path = public_path('images/admin/'.$file);

    expect($path)->toBeFile()
        ->and(file_get_contents($path))->toContain('<svg')
        ->and(file_get_contents($path))->toContain('width="');
})->with([
    'nav-dashboard.svg',
    'nav-employers.svg',
    'nav-job-seekers.svg',
    'nav-jobs.svg',
    'nav-applications.svg',
    'nav-packages.svg',
    'nav-payments.svg',
    'nav-verification.svg',
    'nav-reports.svg',
    'nav-content.svg',
    'nav-notifications.svg',
    'nav-settings.svg',
    'nav-admins.svg',
    'nav-logout.svg',
    'header-menu.svg',
    'header-search.svg',
    'header-bell.svg',
    'header-globe.svg',
    'header-chevron.svg',
    'stat-employers.svg',
    'stat-job-seekers.svg',
    'stat-active-jobs.svg',
    'stat-pending-jobs.svg',
    'stat-applications.svg',
    'stat-monthly-revenue.svg',
    'stat-total-revenue.svg',
    'stat-verifications.svg',
    'stat-trend-up.svg',
    'stat-trend-down.svg',
]);
