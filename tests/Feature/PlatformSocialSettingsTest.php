<?php

use App\Models\PlatformSetting;
use App\Models\User;

test('admins can update footer social media links from platform settings', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->from(route('admin.settings.index'))
        ->put(route('admin.settings.update'), [
            'group' => 'social',
            'values' => [
                'facebook_url' => 'https://facebook.com/rrjobs',
                'twitter_url' => 'https://x.com/rrjobs',
                'linkedin_url' => 'https://linkedin.com/company/rrjobs',
                'instagram_url' => 'https://instagram.com/rrjobs',
            ],
        ])
        ->assertRedirect();

    $stored = PlatformSetting::query()->where('key', 'social')->value('value');

    expect($stored)->toMatchArray([
        'facebook_url' => 'https://facebook.com/rrjobs',
        'twitter_url' => 'https://x.com/rrjobs',
        'linkedin_url' => 'https://linkedin.com/company/rrjobs',
        'instagram_url' => 'https://instagram.com/rrjobs',
    ]);

    $this->get(route('discover'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('platform_social.facebook_url', 'https://facebook.com/rrjobs')
            ->where('platform_social.instagram_url', 'https://instagram.com/rrjobs'));
});

test('admins can update bank payment details used for manual transfers', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->put(route('admin.settings.update'), [
            'group' => 'payments',
            'values' => [
                'bank_name' => 'Bank of Khartoum',
                'bank_account_name' => 'RR Job Portal',
                'bank_account_number' => '998877',
                'bank_iban' => 'SD998877',
                'bank_instructions' => 'Use your company name as the transfer reference.',
            ],
        ])
        ->assertRedirect();

    $employer = User::factory()->employer()->create();

    $this->actingAs($employer)
        ->get(route('employer.packages'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/User/EmployerPackages')
            ->where('bankDetails.bank_name', 'Bank of Khartoum')
            ->where('bankDetails.bank_account_number', '998877')
            ->where('billing.manual_enabled', true));
});
