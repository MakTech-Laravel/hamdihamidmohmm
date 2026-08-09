<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
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

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user ? array_merge(
                    $user->only([
                        'id',
                        'email',
                        'name',
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
}
