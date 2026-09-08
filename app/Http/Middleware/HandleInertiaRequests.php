<?php

namespace App\Http\Middleware;

use App\Support\Locale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $locale = app()->getLocale();

        $seekerHeadline = null;

        if ($user?->isJobSeeker()) {
            $seekerHeadline = $user->jobSeekerProfile()->value('headline');
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'locale' => $locale,
            'dir' => Locale::direction($locale),
            'translations' => $this->translationsFor($locale),
            'availableLocales' => collect(Locale::supported())
                ->map(fn (string $code) => [
                    'code' => $code,
                    'label' => Locale::label($code),
                    'dir' => Locale::direction($code),
                ])
                ->values()
                ->all(),
            'auth' => [
                'user' => $user ? array_merge(
                    $user->only([
                        'id',
                        'email',
                        'name',
                        'company_name',
                        'contact_name',
                        'phone_number',
                        'employee_code',
                        'avatar',
                    ]),
                    [
                        'name' => $this->displayName($user),
                        'role' => $user->role?->value,
                        'role_name' => $user->primaryRoleName()?->value,
                        'role_label' => $user->role_label,
                        'roles' => $user->getRoleNames()->values()->all(),
                        'permissions' => $user->getAllPermissions()->pluck('name')->values()->all(),
                        'can_manage_users' => $user->canManageUsers(),
                        'can_manage_admins' => $user->canManageAdmins(),
                        'avatar_url' => $user->avatar_url,
                        'headline' => $seekerHeadline,
                        'dashboard_url' => route($user->dashboardRoute(), absolute: false),
                        'profile_url' => $this->profileUrl($user),
                    ]
                ) : null,
            ],
            'unread_notifications' => $user?->unreadNotifications()->count() ?? 0,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'features' => [
                'canRegister' => false,
                'canResetPassword' => false,
                'canVerifyEmail' => false,
                'canUseTwoFactorAuthentication' => false,
            ],
        ];
    }

    private function displayName($user): string
    {
        return ! empty($user->name) ? $user->name : $user->email;
    }

    private function profileUrl($user): string
    {
        if ($user->isJobSeeker()) {
            return route('job-seeker.profile', absolute: false);
        }

        if ($user->isEmployer()) {
            return route('employer.profile', absolute: false);
        }

        if ($user->isAdmin()) {
            return route('admin.dashboard', absolute: false);
        }

        return route('dashboard', absolute: false);
    }

    /**
     * @return array<string, string>
     */
    private function translationsFor(string $locale): array
    {
        $path = lang_path("{$locale}.json");

        if (! File::exists($path)) {
            return [];
        }

        /** @var array<string, string> $translations */
        $translations = json_decode(File::get($path), true) ?: [];

        return $translations;
    }
}
