<?php

namespace App\Http\Middleware;

use App\Support\Locale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Inertia\Middleware;
use Laravel\Fortify\Features;

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
        $user = $request->user('web');
        $admin = $request->user('admin');
        $locale = app()->getLocale();

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
                        'phone_number',
                        'employee_code',
                        'avatar',
                    ]),
                    [
                        'name' => $this->displayName($user),
                        'role' => $user->role?->value,
                        'role_label' => $user->role_label,
                        'can_manage_users' => $user->canManageUsers(),
                        'avatar_url' => $user->avatar_url,
                    ]
                ) : null,
                'admin' => $admin ? [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'features' => [
                // 'canRegister' => Features::enabled(Features::registration()),
                // 'canResetPassword' => Features::enabled(Features::resetPasswords()),
                // 'canVerifyEmail' => Features::enabled(Features::emailVerification()),
                // 'canUseTwoFactorAuthentication' => Features::enabled(Features::twoFactorAuthentication()),
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
