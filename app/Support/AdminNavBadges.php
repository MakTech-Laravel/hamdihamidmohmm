<?php

namespace App\Support;

use App\Enums\EmployerAccountStatus;
use App\Enums\JobPostStatus;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Models\ContactMessage;
use App\Models\JobPost;
use App\Models\Payment;
use App\Models\User;

class AdminNavBadges
{
    /**
     * @return array{
     *     employers: int,
     *     verifications: int,
     *     jobs: int,
     *     payments: int,
     *     notifications: int,
     *     contact_messages: int
     * }
     */
    public static function for(?User $user): array
    {
        if ($user === null || ! $user->isAdmin()) {
            return self::empty();
        }

        $pendingEmployers = User::query()
            ->where('role', UserRole::Employer)
            ->where('account_status', EmployerAccountStatus::PendingVerification)
            ->count();

        return [
            'employers' => $pendingEmployers,
            'verifications' => $pendingEmployers,
            'jobs' => JobPost::query()->where('status', JobPostStatus::Pending)->count(),
            'payments' => Payment::query()->where('status', PaymentStatus::Pending)->count(),
            'notifications' => $user->unreadNotifications()->count(),
            'contact_messages' => ContactMessage::query()->whereNull('read_at')->count(),
        ];
    }

    /**
     * @return array{
     *     employers: int,
     *     verifications: int,
     *     jobs: int,
     *     payments: int,
     *     notifications: int,
     *     contact_messages: int
     * }
     */
    public static function empty(): array
    {
        return [
            'employers' => 0,
            'verifications' => 0,
            'jobs' => 0,
            'payments' => 0,
            'notifications' => 0,
            'contact_messages' => 0,
        ];
    }
}
