<?php

use App\Models\PlatformSetting;
use App\Models\User;

test('admins can update support contact details independently from platform settings', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->from(route('admin.settings.index'))
        ->put(route('admin.settings.update'), [
            'group' => 'general',
            'values' => [
                'platform_name' => 'RR Job Portal',
                'support_phone' => '+249 183 000 111',
                'support_phone_secondary' => '+249 912 000 222',
                'company_address' => 'Khartoum, Sudan',
                'support_email' => 'help@rrjobs.test',
                'website_url' => 'https://www.rrjobportal.ae',
                'contact_email' => 'hello@rrjobs.test',
            ],
        ])
        ->assertRedirect();

    $stored = PlatformSetting::query()->where('key', 'general')->value('value');

    expect($stored)->toMatchArray([
        'support_phone' => '+249 183 000 111',
        'support_phone_secondary' => '+249 912 000 222',
        'support_email' => 'help@rrjobs.test',
        'contact_email' => 'hello@rrjobs.test',
        'company_address' => 'Khartoum, Sudan',
    ]);
});

test('public pages share support contact details for footer and contact sections', function () {
    PlatformSetting::query()->updateOrCreate(
        ['key' => 'general'],
        ['value' => [
            'platform_name' => 'RR Job Portal',
            'support_phone' => '+971 4 999 8888',
            'support_phone_secondary' => '+971 50 999 7777',
            'company_address' => 'Dubai, UAE',
            'support_email' => 'support@example.test',
            'website_url' => 'https://example.test',
            'contact_email' => 'contact@example.test',
        ]],
    );

    $this->get(route('discover'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('platform_contact.support_phone', '+971 4 999 8888')
            ->where('platform_contact.support_phone_secondary', '+971 50 999 7777')
            ->where('platform_contact.support_email', 'support@example.test'));

    $this->get(route('contact'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('frontend/contact')
            ->where('platform_contact.support_phone', '+971 4 999 8888')
            ->where('platform_contact.support_email', 'support@example.test')
            ->where('platform_contact.company_address', 'Dubai, UAE'));
});

test('updating social settings does not overwrite support contact details', function () {
    PlatformSetting::query()->updateOrCreate(
        ['key' => 'general'],
        ['value' => [
            'platform_name' => 'RR Job Portal',
            'support_phone' => '+971 4 111 2222',
            'support_phone_secondary' => '',
            'company_address' => 'Dubai',
            'support_email' => 'keep@rrjobs.test',
            'website_url' => 'https://www.rrjobportal.ae',
            'contact_email' => 'contact@rrjobportal.ae',
        ]],
    );

    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->put(route('admin.settings.update'), [
            'group' => 'social',
            'values' => [
                'facebook_url' => 'https://facebook.com/rrjobs',
                'twitter_url' => '',
                'linkedin_url' => '',
                'instagram_url' => '',
            ],
        ])
        ->assertRedirect();

    $general = PlatformSetting::query()->where('key', 'general')->value('value');

    expect($general)->toMatchArray([
        'support_phone' => '+971 4 111 2222',
        'support_email' => 'keep@rrjobs.test',
    ]);
});
