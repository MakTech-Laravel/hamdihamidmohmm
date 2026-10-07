<?php

use App\Models\User;
use App\Support\Locale;

test('employer dashboard shares employer portal translation keys', function () {
    $employer = User::factory()->employer()->create();

    $this->actingAs($employer)
        ->get(route('employer.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/User/EmployerDashboard')
            ->has('translations')
            ->where('translations', fn ($translations) => ($translations['employer.portal'] ?? null) === 'Employer Portal'
                && ($translations['employer.nav.dashboard'] ?? null) === 'Dashboard'
                && ($translations['employer.dashboard.title'] ?? null) === 'Dashboard'
                && ($translations['employer.settings.title'] ?? null) === 'Settings'
                && ($translations['employer.notifications.title'] ?? null) === 'Notifications'
                && ($translations['employer.profile.title'] ?? null) === 'Organization Profile'
                && ($translations['common.logout'] ?? null) === 'Logout'
                && ($translations['common.public_website'] ?? null) === 'Public Website'
                && ($translations['common.notifications'] ?? null) === 'Notifications'));
});

test('employer portal translation keys exist in english and arabic', function () {
    $english = json_decode((string) file_get_contents(lang_path('en.json')), true);
    $arabic = json_decode((string) file_get_contents(lang_path('ar.json')), true);

    expect($english)->toBeArray()
        ->and($arabic)->toBeArray();

    $keys = [
        'employer.portal',
        'employer.nav.dashboard',
        'employer.nav.company_profile',
        'employer.nav.packages',
        'employer.nav.jobs',
        'employer.nav.applications',
        'employer.nav.notifications',
        'employer.nav.settings',
        'employer.header.user_menu',
        'employer.dashboard.title',
        'employer.dashboard.welcome',
        'employer.dashboard.quick_actions',
        'employer.dashboard.active_jobs',
        'employer.dashboard.recent_applications',
        'employer.dashboard.notifications',
        'employer.dashboard.view_all',
        'employer.notifications.title',
        'employer.notifications.mark_all',
        'employer.notifications.empty',
        'employer.notifications.filter.all',
        'employer.profile.title',
        'employer.profile.company_information',
        'employer.profile.organization_information',
        'employer.profile.organization_type',
        'employer.profile.organization_type.private_company',
        'employer.profile.organization_type.non_profit',
        'employer.profile.organization_type.ngo',
        'employer.profile.organization_type.institute',
        'employer.profile.organization_type.public_sector',
        'employer.profile.public_about',
        'employer.profile.completion',
        'auth.organization_type',
        'employer.jobs.title',
        'employer.jobs.subtitle',
        'employer.jobs.post_new',
        'employer.jobs.delete',
        'employer.jobs.delete_confirm',
        'employer.job_editor.title_create',
        'employer.job_editor.step.basics',
        'employer.job_editor.logo.upload',
        'employer.job_editor.field.category_other',
        'employer.job_editor.field.category_add',
        'employer.applications.title',
        'employer.applications.col.candidate',
        'employer.packages.title',
        'employer.packages.available_plans',
        'employer.packages.btn.select',
        'employer.drawer.contact',
        'employer.drawer.download_resume',
        'employer.settings.title',
        'employer.settings.subtitle',
        'employer.settings.tab.account',
        'employer.settings.tab.notifications',
        'employer.settings.tab.privacy',
        'employer.settings.tab.language',
        'employer.settings.tab.danger',
        'common.logout',
        'common.log_out',
        'common.profile',
        'common.public_website',
        'common.notifications',
        'common.actions',
        'common.status',
        'common.publish',
        'lang.switch_to_arabic',
        'lang.switch_to_english',
    ];

    foreach ($keys as $key) {
        expect($english)->toHaveKey($key)
            ->and($arabic)->toHaveKey($key)
            ->and($english[$key])->not->toBe('')
            ->and($arabic[$key])->not->toBe('');
    }
});

test('arabic locale shares arabic employer portal translations on dashboard', function () {
    $employer = User::factory()->employer()->create();

    $this->actingAs($employer)
        ->withUnencryptedCookie(Locale::COOKIE, Locale::ARABIC)
        ->withSession([Locale::COOKIE => Locale::ARABIC])
        ->get(route('employer.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('locale', Locale::ARABIC)
            ->where('dir', 'rtl')
            ->where('translations', fn ($translations) => ($translations['employer.portal'] ?? null) === 'بوابة أصحاب العمل'
                && ($translations['employer.dashboard.title'] ?? null) === 'لوحة التحكم'
                && ($translations['employer.nav.dashboard'] ?? null) === 'لوحة التحكم'));
});
