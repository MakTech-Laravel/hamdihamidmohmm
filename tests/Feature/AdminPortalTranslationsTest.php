<?php

use App\Models\User;
use App\Support\Locale;

test('admin dashboard shares admin portal translation keys', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/Admin/AdminDashboard')
            ->has('translations')
            ->where('translations', fn ($translations) => ($translations['admin.portal'] ?? null) === 'Admin Portal'
                && ($translations['admin.brand'] ?? null) === 'RR Job Portal'
                && ($translations['admin.nav.dashboard'] ?? null) === 'Dashboard'
                && ($translations['admin.nav.logout'] ?? null) === 'Logout'
                && ($translations['admin.dashboard.title'] ?? null) === 'Admin Dashboard'
                && ($translations['admin.dashboard.welcome'] ?? null) === 'Welcome back, :name'
                && ($translations['admin.packages.title'] ?? null) === 'Packages & Pricing'
                && ($translations['admin.packages.subtitle'] ?? null) === 'Manage employer subscription packages.'
                && ($translations['admin.packages.add'] ?? null) === 'Add Package'
                && ($translations['admin.candidate.no_preview'] ?? null) === 'No preview available.'
                && ($translations['admin.search_placeholder'] ?? null) === 'Search…'
                && ($translations['common.notifications'] ?? null) === 'Notifications'
                && ($translations['common.showing_range'] ?? null) === 'Showing :from-:to of :total'
                && ($translations['status.archived'] ?? null) === 'Archived'));
});

test('admin portal translation keys exist in english and arabic', function () {
    $english = json_decode((string) file_get_contents(lang_path('en.json')), true);
    $arabic = json_decode((string) file_get_contents(lang_path('ar.json')), true);

    expect($english)->toBeArray()
        ->and($arabic)->toBeArray();

    $keys = [
        'admin.portal',
        'admin.brand',
        'admin.search_placeholder',
        'admin.header.operational',
        'admin.nav.dashboard',
        'admin.nav.users',
        'admin.nav.roles',
        'admin.nav.employers',
        'admin.nav.job_seekers',
        'admin.nav.jobs',
        'admin.nav.job_filters',
        'admin.nav.applications',
        'admin.nav.packages',
        'admin.nav.payments',
        'admin.nav.verifications',
        'admin.nav.reports',
        'admin.nav.content',
        'admin.nav.training',
        'admin.nav.notifications',
        'admin.nav.settings',
        'admin.nav.admins',
        'admin.nav.logout',
        'admin.dashboard.title',
        'admin.dashboard.welcome',
        'admin.dashboard.subtitle',
        'admin.packages.title',
        'admin.packages.subtitle',
        'admin.packages.add',
        'admin.packages.empty',
        'admin.payments.title',
        'admin.payments.subtitle',
        'admin.verifications.title',
        'admin.verifications.subtitle',
        'admin.employers.title',
        'admin.employers.subtitle',
        'admin.employers.add',
        'admin.job_seekers.title',
        'admin.job_seekers.subtitle',
        'admin.job_seekers.add',
        'admin.jobs.title',
        'admin.jobs.subtitle',
        'admin.applications.title',
        'admin.applications.subtitle',
        'admin.settings.title',
        'admin.notifications.title',
        'admin.notifications.subtitle',
        'admin.reports.title',
        'admin.reports.subtitle',
        'admin.content.title',
        'admin.content.subtitle',
        'admin.training.title',
        'admin.training.subtitle',
        'admin.roles.title',
        'admin.roles.subtitle',
        'admin.roles.create_title',
        'admin.users.title',
        'admin.users.subtitle',
        'admin.admins.title',
        'admin.admins.subtitle',
        'admin.admins.create',
        'admin.candidate.no_preview',
        'admin.candidate.download_resume',
        'admin.activity.title',
        'admin.stats.total_users',
        'common.notifications',
        'common.logout',
        'common.saved',
        'common.showing_range',
        'common.details',
        'common.export',
        'common.approve',
        'common.toggle_sidebar',
        'common.switch_language',
        'status.archived',
        'status.locked',
        'status.pending_verification',
        'status.suspended',
    ];

    foreach ($keys as $key) {
        expect($english)->toHaveKey($key)
            ->and($arabic)->toHaveKey($key)
            ->and($english[$key])->not->toBe('')
            ->and($arabic[$key])->not->toBe('');
    }
});

test('arabic locale shares arabic admin portal translations on dashboard', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->withUnencryptedCookie(Locale::COOKIE, Locale::ARABIC)
        ->withSession([Locale::COOKIE => Locale::ARABIC])
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('locale', Locale::ARABIC)
            ->where('dir', 'rtl')
            ->where('translations', fn ($translations) => ($translations['admin.portal'] ?? null) === 'بوابة الإدارة'
                && ($translations['admin.dashboard.title'] ?? null) === 'لوحة تحكم المشرف'
                && ($translations['admin.nav.dashboard'] ?? null) === 'لوحة التحكم'));
});
