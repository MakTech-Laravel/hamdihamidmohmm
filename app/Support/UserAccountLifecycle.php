<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Str;

final class UserAccountLifecycle
{
    /**
     * Free the login email so the same address can register again,
     * while keeping the original address for admin contact display.
     */
    public static function releaseEmail(User $user): void
    {
        $current = (string) $user->email;

        if ($current === '' || str_starts_with($current, 'released.')) {
            return;
        }

        $user->forceFill([
            'original_email' => $user->original_email ?: $current,
            'email' => sprintf(
                'released.%d.%s@zaroog.invalid',
                $user->id,
                Str::lower(Str::random(10)),
            ),
        ])->saveQuietly();
    }

    public static function deleteAccount(User $user): void
    {
        self::releaseEmail($user);
        $user->delete();
    }

    public static function displayEmail(User $user): string
    {
        return (string) ($user->original_email ?: $user->email);
    }
}
