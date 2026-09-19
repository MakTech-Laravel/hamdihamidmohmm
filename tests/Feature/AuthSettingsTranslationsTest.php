<?php

test('auth and settings translation keys exist in english and arabic', function () {
    $english = json_decode((string) file_get_contents(lang_path('en.json')), true);
    $arabic = json_decode((string) file_get_contents(lang_path('ar.json')), true);

    expect($english)->toBeArray()
        ->and($arabic)->toBeArray();

    $keys = [
        'app.logo_alt',
        'app.name',
        'app.user_dashboard',
        'auth.admin_access',
        'auth.admin_credentials_hint',
        'auth.admin_description',
        'auth.admin_login',
        'auth.admin_restricted',
        'auth.authentication_code',
        'auth.back_to_login',
        'auth.confirm_password_title',
        'auth.email_verification',
        'auth.footer.copyright',
        'auth.footer.tagline',
        'auth.forgot_password_title',
        'auth.get_started',
        'auth.log_in',
        'auth.new_password',
        'auth.recovery_code',
        'auth.resend_verification',
        'auth.reset_password',
        'auth.send_reset_link',
        'auth.two_factor',
        'auth.verify_email',
        'auth.verify_identity',
        'auth.welcome_back',
        'common.dashboard',
        'common.features',
        'common.save',
        'settings.appearance.title',
        'settings.delete.title',
        'settings.description',
        'settings.nav.profile',
        'settings.password.title',
        'settings.profile.title',
        'settings.saved',
        'settings.title',
        'settings.two_factor.title',
        'settings.two_factor.recovery_codes_title',
        'settings.two_factor.enable_title',
        'common.confirm',
        'common.continue',
        'appearance.toggle_theme',
        'common.mark_as_read',
        'common.close_sidebar',
        'location.khartoum',
        'category.engineering',
        'home.recommended_empty_title',
        'footer.mts_copyright',
    ];

    foreach ($keys as $key) {
        expect($english)->toHaveKey($key)
            ->and($arabic)->toHaveKey($key)
            ->and($english[$key])->not->toBe('')
            ->and($arabic[$key])->not->toBe('');
    }

    expect(array_keys($english))->toEqual(array_keys($arabic));
});

test('login page shares auth translation keys', function () {
    $this->get(route('login'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('auth/login')
            ->has('translations')
            ->where('translations', fn ($translations) => ($translations['auth.welcome_back'] ?? null) === 'Welcome Back'
                && ($translations['auth.login'] ?? null) === 'Login'
                && ($translations['auth.forgot_password_title'] ?? null) === 'Forgot password'
                && ($translations['app.logo_alt'] ?? null) === 'Rena Reiam For Job'
                && ($translations['settings.title'] ?? null) === 'Settings'));
});
