<?php

namespace App\Support;

use App\Enums\EmployerPackage;
use App\Enums\EmployerVerificationStatus;
use App\Enums\JobPostStatus;
use App\Enums\PaymentStatus;
use App\Models\JobPost;
use App\Models\Package;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Carbon;

class EmployerPlanSnapshot
{
    /**
     * @return array{
     *     slug: string|null,
     *     label: string|null,
     *     job_credits: int,
     *     jobs_posted: int,
     *     credits_used: int,
     *     credits_remaining: int,
     *     expires_at: string|null,
     *     expires_on: string|null,
     *     days_remaining: int|null,
     *     is_verified: bool,
     *     verified_on: string|null,
     *     can_post_job: bool
     * }
     */
    public static function for(User $employer): array
    {
        $catalog = static::catalogPackage($employer->package);
        $jobsPosted = static::jobsUsingCredits($employer);

        $jobCredits = (int) ($catalog?->job_credits ?? 0);
        $creditsRemaining = max(0, $jobCredits - $jobsPosted);
        $expiresAt = static::expiresAt($employer);

        return [
            'slug' => $employer->package?->value,
            'label' => $catalog?->name ?? $employer->package?->label(),
            'job_credits' => $jobCredits,
            'jobs_posted' => $jobsPosted,
            'credits_used' => $jobsPosted,
            'credits_remaining' => $creditsRemaining,
            'expires_at' => $expiresAt?->toDateString(),
            'expires_on' => $expiresAt?->format('M j, Y'),
            'days_remaining' => $expiresAt instanceof Carbon
                ? (int) max(0, now()->startOfDay()->diffInDays($expiresAt->copy()->startOfDay(), false))
                : null,
            'is_verified' => $employer->verification_status === EmployerVerificationStatus::Approved,
            'verified_on' => $employer->verified_at?->format('M j, Y'),
            'can_post_job' => $catalog === null ? true : $creditsRemaining > 0,
        ];
    }

    public static function catalogPackage(?EmployerPackage $package): ?Package
    {
        if (! $package instanceof EmployerPackage) {
            return null;
        }

        return Package::query()->where('slug', $package->value)->first();
    }

    public static function jobsUsingCredits(User $employer): int
    {
        return JobPost::query()
            ->where('employer_id', $employer->id)
            ->whereIn('status', [
                JobPostStatus::Pending->value,
                JobPostStatus::Active->value,
                JobPostStatus::Expired->value,
            ])
            ->count();
    }

    public static function expiresAt(User $employer): ?Carbon
    {
        $paidAt = Payment::query()
            ->where('employer_id', $employer->id)
            ->where('status', PaymentStatus::Completed)
            ->latest('paid_at')
            ->value('paid_at');

        if ($paidAt !== null) {
            return Carbon::parse($paidAt)->addMonth();
        }

        return null;
    }
}
