<?php

use App\Models\JobSeekerProfile;
use App\Models\User;
use App\Support\PortalPreferences;
use Illuminate\Support\Facades\DB;

test('job seekers can update personal settings including bio and timezone', function () {
    $seeker = User::factory()->jobSeeker()->create([
        'name' => 'Old Name',
        'timezone' => 'UTC',
    ]);
    JobSeekerProfile::factory()->create([
        'user_id' => $seeker->id,
        'bio' => 'Old bio',
    ]);

    $this->actingAs($seeker)
        ->from(route('job-seeker.settings'))
        ->put(route('job-seeker.settings.update'), [
            'name' => 'Noura Al-Harbi',
            'bio' => 'Frontend engineer in Riyadh',
            'timezone' => 'Asia/Riyadh',
        ])
        ->assertRedirect(route('job-seeker.settings'));

    $seeker->refresh();

    expect($seeker->name)->toBe('Noura Al-Harbi')
        ->and($seeker->timezone)->toBe('Asia/Riyadh')
        ->and($seeker->jobSeekerProfile?->bio)->toBe('Frontend engineer in Riyadh');
});

test('job seekers can save email preferences', function () {
    $seeker = User::factory()->jobSeeker()->create();

    $this->actingAs($seeker)
        ->from(route('job-seeker.settings'))
        ->put(route('job-seeker.settings.email-preferences'), [
            'application_status' => false,
            'interview_invitations' => true,
            'job_recommendations' => false,
            'platform_announcements' => true,
        ])
        ->assertRedirect(route('job-seeker.settings'));

    $prefs = PortalPreferences::for($seeker->fresh());

    expect($prefs['email_preferences']['application_status'])->toBeFalse()
        ->and($prefs['email_preferences']['interview_invitations'])->toBeTrue()
        ->and($prefs['email_preferences']['job_recommendations'])->toBeFalse()
        ->and($prefs['email_preferences']['platform_announcements'])->toBeTrue();
});

test('job seeker settings page exposes sessions and two factor status', function () {
    $seeker = User::factory()->jobSeeker()->create([
        'two_factor_confirmed_at' => now(),
    ]);
    JobSeekerProfile::factory()->create([
        'user_id' => $seeker->id,
        'bio' => 'Seeking roles',
    ]);

    $this->actingAs($seeker)
        ->get(route('job-seeker.settings'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/User/JobSeekerSettings')
            ->where('user.bio', 'Seeking roles')
            ->where('two_factor_enabled', true)
            ->has('sessions')
            ->has('preferences.email_preferences'));
});

test('job seekers can revoke other sessions', function () {
    $seeker = User::factory()->jobSeeker()->create();

    $this->actingAs($seeker);
    $currentId = session()->getId();

    DB::table('sessions')->insert([
        [
            'id' => 'other-session-1',
            'user_id' => $seeker->id,
            'ip_address' => '1.1.1.1',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
            'payload' => 'payload',
            'last_activity' => now()->subHour()->timestamp,
        ],
        [
            'id' => 'other-session-2',
            'user_id' => $seeker->id,
            'ip_address' => '2.2.2.2',
            'user_agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari/17.0',
            'payload' => 'payload',
            'last_activity' => now()->subMinutes(30)->timestamp,
        ],
    ]);

    $this->actingAs($seeker)
        ->from(route('job-seeker.settings'))
        ->delete(route('job-seeker.settings.sessions.destroy'))
        ->assertRedirect(route('job-seeker.settings'));

    expect(DB::table('sessions')->where('user_id', $seeker->id)->where('id', '!=', $currentId)->count())->toBe(0);
});
