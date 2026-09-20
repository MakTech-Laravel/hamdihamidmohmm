<?php

use App\Enums\ActivityAction;
use App\Enums\EmployerPackage;
use App\Enums\JobSeekerAccountStatus;
use App\Models\ActivityLog;
use App\Models\User;

test('admins can view the designed admin dashboard', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/Admin/AdminDashboard')
            ->has('stats')
            ->where('stats.currency', 'SDG')
            ->has('trends')
            ->has('chart')
            ->has('packages')
            ->has('activities')
            ->has('alerts'));
});

test('the admin dashboard shows live employer and job seeker counts', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->employer()->count(2)->create();
    User::factory()->jobSeeker()->count(3)->create();

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('stats.total_employers', 2)
            ->where('stats.total_job_seekers', 3)
            ->where('stats.active_employers', 2)
            ->where('stats.active_job_seekers', 3)
            ->where('stats.total_users', 6)
            ->where('stats.total_admins', 1)
            ->where('stats.suspended_accounts', 0)
            ->where('quickStats.unread_alerts', 0));
});

test('the admin dashboard alerts on pending employer verifications', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->pendingEmployer()->create();

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('stats.pending_verifications', 1)
            ->where('quickStats.tasks_today', 1)
            ->where('alerts.0.title', '1 pending employer verification')
            ->where('alerts.0.href', '/admin/employers?status=pending')
            ->where('admin_nav_badges.employers', 1)
            ->where('admin_nav_badges.verifications', 1));
});

test('the admin dashboard shows activity logs', function () {
    $admin = User::factory()->admin()->create();
    $seeker = User::factory()->jobSeeker()->create(['name' => 'Ali Khan']);

    ActivityLog::factory()->create([
        'user_id' => $seeker->id,
        'actor_id' => $admin->id,
        'action' => ActivityAction::LoggedIn,
        'description' => 'Signed in to the portal.',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activities.0.action_label', 'Signed in')
            ->where('activities.0.subject_name', 'Ali Khan'));
});

test('the admin dashboard accepts a registration chart range', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->jobSeeker()->create();

    $this->actingAs($admin)
        ->get(route('admin.dashboard', ['range' => '30d']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('chart.range', '30d')
            ->has('chart.labels', 30)
            ->has('chart.employers', 30)
            ->has('chart.job_seekers', 30));
});

test('the admin dashboard shows employer package distribution', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->employer()->create(['package' => EmployerPackage::Starter]);
    User::factory()->employer()->create(['package' => EmployerPackage::Professional]);

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('packages', 4)
            ->where('packages.0.value', 'starter')
            ->where('packages.0.count', 1)
            ->where('packages.1.value', 'professional')
            ->where('packages.1.count', 1)
            ->where('packages.0.percent', 50)
            ->where('packages.1.percent', 50));
});

test('the admin dashboard counts suspended job seekers', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->jobSeeker()->create([
        'account_status' => JobSeekerAccountStatus::Suspended,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('stats.suspended_accounts', 1)
            ->where('alerts.0.title', '1 suspended job seeker'));
});

test('job seekers cannot view the admin dashboard', function () {
    $seeker = User::factory()->jobSeeker()->create();

    $this->actingAs($seeker)
        ->get(route('admin.dashboard'))
        ->assertRedirect(route('job-seeker.dashboard'));
});

test('admin portal ships the figma company logo', function () {
    $path = public_path('images/admin/logo.png');
    $brand = public_path('images/home/logo.png');
    $info = getimagesize($path);

    expect($path)->toBeFile()
        ->and($brand)->toBeFile()
        ->and(md5_file($path))->toBe(md5_file($brand))
        ->and($info[0])->toBe(250)
        ->and($info[1])->toBe(166)
        ->and($info['mime'])->toBe('image/png');
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
