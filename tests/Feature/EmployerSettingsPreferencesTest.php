<?php

use App\Enums\EmployerAccountStatus;
use App\Models\User;
use App\Support\PortalPreferences;

test('employers can save notification and privacy preferences', function () {
    $employer = User::factory()->employer()->create();

    $this->actingAs($employer)
        ->from(route('employer.settings'))
        ->put(route('employer.settings.notifications'), [
            'new_applications' => false,
            'job_expiry' => true,
            'billing_alerts' => false,
            'system_updates' => true,
            'weekly_report' => false,
        ])
        ->assertRedirect(route('employer.settings'));

    $this->actingAs($employer)
        ->from(route('employer.settings'))
        ->put(route('employer.settings.privacy'), [
            'profile_visibility' => 'private',
            'show_salary' => false,
            'show_contact_email' => true,
        ])
        ->assertRedirect(route('employer.settings'));

    $employer->refresh();
    $prefs = PortalPreferences::for($employer);

    expect($prefs['notifications']['new_applications'])->toBeFalse()
        ->and($prefs['notifications']['system_updates'])->toBeTrue()
        ->and($prefs['privacy']['profile_visibility'])->toBe('private')
        ->and($prefs['privacy']['show_salary'])->toBeFalse()
        ->and($prefs['privacy']['show_contact_email'])->toBeTrue();

    $this->actingAs($employer)
        ->get(route('employer.settings'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/User/EmployerSettings')
            ->where('preferences.notifications.new_applications', false)
            ->where('preferences.privacy.profile_visibility', 'private'));
});

test('employers can deactivate their account with password confirmation', function () {
    $employer = User::factory()->employer()->create();

    $this->actingAs($employer)
        ->from(route('employer.settings'))
        ->post(route('employer.settings.deactivate'), [
            'password' => 'password',
        ])
        ->assertRedirect('/');

    $this->assertGuest();

    expect($employer->fresh()?->account_status)->toBe(EmployerAccountStatus::Suspended);
});

test('employers can delete their account with password confirmation', function () {
    $employer = User::factory()->employer()->create();
    $employerId = $employer->id;

    $this->actingAs($employer)
        ->from(route('employer.settings'))
        ->delete(route('employer.settings.destroy'), [
            'password' => 'password',
        ])
        ->assertRedirect('/');

    $this->assertGuest();
    expect(User::query()->find($employerId))->toBeNull();
});

test('employer account deletion requires the current password', function () {
    $employer = User::factory()->employer()->create();

    $this->actingAs($employer)
        ->from(route('employer.settings'))
        ->delete(route('employer.settings.destroy'), [
            'password' => 'wrong-password',
        ])
        ->assertRedirect(route('employer.settings'))
        ->assertSessionHasErrors('password');

    expect(User::query()->find($employer->id))->not->toBeNull();
});
