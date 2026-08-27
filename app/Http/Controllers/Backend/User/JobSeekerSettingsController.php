<?php

namespace App\Http\Controllers\Backend\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\User\UpdateJobSeekerEmailPreferencesRequest;
use App\Http\Requests\Backend\User\UpdateJobSeekerSettingsRequest;
use App\Models\JobSeekerProfile;
use App\Support\PortalPreferences;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class JobSeekerSettingsController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user !== null, 403);

        $preferences = PortalPreferences::for($user);
        $profile = $user->jobSeekerProfile;
        $currentSessionId = $request->session()->getId();

        $sessions = DB::table('sessions')
            ->where('user_id', $user->id)
            ->orderByDesc('last_activity')
            ->get()
            ->map(function ($session) use ($currentSessionId) {
                $agent = (string) ($session->user_agent ?? '');

                return [
                    'id' => $session->id,
                    'is_current' => $session->id === $currentSessionId,
                    'device' => $this->describeAgent($agent),
                    'ip_address' => $session->ip_address,
                    'last_active' => isset($session->last_activity)
                        ? Carbon::createFromTimestamp($session->last_activity)->diffForHumans()
                        : null,
                ];
            })
            ->values();

        return Inertia::render('backend/User/JobSeekerSettings', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role?->value,
                'role_label' => $user->role_label,
                'bio' => $profile?->bio,
                'timezone' => $user->timezone ?: 'Asia/Riyadh',
            ],
            'preferences' => [
                'email_preferences' => $preferences['email_preferences'],
            ],
            'two_factor_enabled' => $user->two_factor_confirmed_at !== null,
            'sessions' => $sessions,
        ]);
    }

    public function updatePersonal(UpdateJobSeekerSettingsRequest $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);

        $validated = $request->validated();

        $user->forceFill([
            'name' => $validated['name'],
            'timezone' => $validated['timezone'] ?? $user->timezone,
        ])->save();

        JobSeekerProfile::query()->updateOrCreate(
            ['user_id' => $user->id],
            ['bio' => $validated['bio'] ?? null],
        );

        return back()->with('success', 'Personal settings saved.');
    }

    public function updateEmailPreferences(UpdateJobSeekerEmailPreferencesRequest $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);

        $user->forceFill([
            'portal_preferences' => PortalPreferences::mergeEmailPreferences($user, $request->validated()),
        ])->save();

        return back()->with('success', 'Email preferences saved.');
    }

    public function destroyOtherSessions(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user?->isJobSeeker() === true, 403);

        DB::table('sessions')
            ->where('user_id', $user->id)
            ->where('id', '!=', $request->session()->getId())
            ->delete();

        return back()->with('success', 'Other sessions have been revoked.');
    }

    private function describeAgent(string $userAgent): string
    {
        $browser = match (true) {
            str_contains($userAgent, 'Edg/') => 'Edge',
            str_contains($userAgent, 'Chrome/') => 'Chrome',
            str_contains($userAgent, 'Firefox/') => 'Firefox',
            str_contains($userAgent, 'Safari/') && ! str_contains($userAgent, 'Chrome/') => 'Safari',
            default => 'Browser',
        };

        $platform = match (true) {
            str_contains($userAgent, 'Windows') => 'Windows',
            str_contains($userAgent, 'Mac OS') || str_contains($userAgent, 'Macintosh') => 'macOS',
            str_contains($userAgent, 'Android') => 'Android',
            str_contains($userAgent, 'iPhone') || str_contains($userAgent, 'iPad') => 'iOS',
            str_contains($userAgent, 'Linux') => 'Linux',
            default => 'Unknown device',
        };

        return "{$browser} on {$platform}";
    }
}
