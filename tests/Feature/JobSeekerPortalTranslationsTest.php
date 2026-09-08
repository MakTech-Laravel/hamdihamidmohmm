<?php

use App\Models\User;
use App\Support\Locale;

test('job seeker dashboard shares job seeker portal translation keys', function () {
    $seeker = User::factory()->jobSeeker()->create();

    $this->actingAs($seeker)
        ->get(route('job-seeker.dashboard'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('backend/User/JobSeekerDashboard')
            ->has('translations')
            ->where('translations', fn($translations) => ($translations['job_seeker.portal'] ?? null) === 'Job Seeker Portal'
                && ($translations['job_seeker.nav.dashboard'] ?? null) === 'Dashboard'
                && ($translations['job_seeker.dashboard.title'] ?? null) === 'Dashboard'
                && ($translations['job_seeker.dashboard.tagline'] ?? null) === "Let's help you find your next opportunity."
                && ($translations['job_seeker.dashboard.quick_actions'] ?? null) === 'Quick Actions'
                && ($translations['job_seeker.applications.view_details'] ?? null) === 'View Details'
                && ($translations['job_seeker.settings.subtitle'] ?? null) === 'Manage your preferences and security settings.'
                && ($translations['common.expand_sidebar'] ?? null) === 'Expand sidebar'
                && ($translations['common.close'] ?? null) === 'Close'
                && ($translations['app.name'] ?? null) === 'RR Job Portal'
                && ($translations['common.public_website'] ?? null) === 'Public Website'));
});

test('job seeker portal translation keys exist in english and arabic', function () {
    $english = json_decode((string) file_get_contents(lang_path('en.json')), true);
    $arabic = json_decode((string) file_get_contents(lang_path('ar.json')), true);

    expect($english)->toBeArray()
        ->and($arabic)->toBeArray();

    $keys = [
        'app.name',
        'common.active',
        'common.all',
        'common.close',
        'common.collapse_sidebar',
        'common.expand_sidebar',
        'common.logout',
        'common.public_website',
        'common.save_changes',
        'job_seeker.applications.applied',
        'job_seeker.applications.fallback_title',
        'job_seeker.applications.no_selected',
        'job_seeker.applications.salary',
        'job_seeker.applications.status_timeline',
        'job_seeker.applications.title',
        'job_seeker.applications.type',
        'job_seeker.applications.view_details',
        'job_seeker.applications.view_job',
        'job_seeker.applications.withdraw',
        'job_seeker.dashboard.browse_jobs',
        'job_seeker.dashboard.complete_now',
        'job_seeker.dashboard.complete_profile',
        'job_seeker.dashboard.quick_actions',
        'job_seeker.dashboard.tagline',
        'job_seeker.dashboard.title',
        'job_seeker.dashboard.update_profile',
        'job_seeker.dashboard.welcome',
        'job_seeker.header.user_menu',
        'job_seeker.nav.applications',
        'job_seeker.nav.dashboard',
        'job_seeker.nav.jobs',
        'job_seeker.nav.notifications',
        'job_seeker.nav.profile',
        'job_seeker.nav.settings',
        'job_seeker.notifications.empty',
        'job_seeker.notifications.mark_all',
        'job_seeker.notifications.title',
        'job_seeker.portal',
        'job_seeker.settings.confirm_password',
        'job_seeker.settings.current_password',
        'job_seeker.settings.disabled',
        'job_seeker.settings.display_name',
        'job_seeker.settings.enabled',
        'job_seeker.settings.manage',
        'job_seeker.settings.new_password',
        'job_seeker.settings.preferred_language',
        'job_seeker.settings.revoke_sessions',
        'job_seeker.settings.save_preferences',
        'job_seeker.settings.short_bio',
        'job_seeker.settings.status',
        'job_seeker.settings.subtitle',
        'job_seeker.settings.this_device',
        'job_seeker.settings.timezone_dubai',
        'job_seeker.settings.timezone_riyadh',
        'job_seeker.settings.timezone_utc',
        'job_seeker.settings.title',
        'job_seeker.settings.two_factor',
        'job_seeker.settings.two_factor_disabled',
        'job_seeker.settings.two_factor_enabled',
        'lang.arabic',
        'lang.english',
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

test('arabic locale shares arabic job seeker portal translations on dashboard', function () {
    $seeker = User::factory()->jobSeeker()->create();

    $this->actingAs($seeker)
        ->withUnencryptedCookie(Locale::COOKIE, Locale::ARABIC)
        ->withSession([Locale::COOKIE => Locale::ARABIC])
        ->get(route('job-seeker.dashboard'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->where('locale', Locale::ARABIC)
            ->where('dir', 'rtl')
            ->where('translations', fn($translations) => ($translations['job_seeker.portal'] ?? null) === 'بوابة الباحثين عن عمل'
                && ($translations['job_seeker.dashboard.title'] ?? null) === 'لوحة التحكم'
                && ($translations['job_seeker.dashboard.quick_actions'] ?? null) === 'إجراءات سريعة'
                && ($translations['job_seeker.nav.dashboard'] ?? null) === 'لوحة التحكم'));
});
