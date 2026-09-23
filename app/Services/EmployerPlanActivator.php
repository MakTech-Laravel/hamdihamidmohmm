<?php

namespace App\Services;

use App\Enums\EmployerPackage;
use App\Enums\PaymentStatus;
use App\Enums\SubscriptionStatus;
use App\Models\Package;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Str;

class EmployerPlanActivator
{
    /**
     * Activate a complimentary (free) package for an employer.
     *
     * @return array{status: string, message: string}
     */
    public function activateComplimentary(User $employer, Package $package): array
    {
        abort_unless($package->is_active && $package->is_public, 404);

        $plan = EmployerPackage::tryFrom($package->slug);
        abort_unless($plan instanceof EmployerPackage, 422);
        abort_unless($package->price < 1, 422);

        if ($employer->package === $plan && $employer->subscription_status?->isActive()) {
            return [
                'status' => 'already',
                'message' => 'This is already your current plan.',
            ];
        }

        Payment::query()->create([
            'employer_id' => $employer->id,
            'package_id' => $package->id,
            'amount' => $package->price,
            'currency' => $package->currency ?: 'SDG',
            'method' => 'complimentary',
            'status' => PaymentStatus::Completed,
            'reference' => 'COMP-'.Str::upper(Str::random(10)),
            'paid_at' => now(),
        ]);

        $this->assignPlan($employer, $package);

        return [
            'status' => 'complimentary',
            'message' => 'Your complimentary plan is now active.',
        ];
    }

    /**
     * Assign a paid package after successful payment (YallaPay, bank transfer approval, etc.).
     */
    public function assignPaidPlan(User $employer, Package $package): void
    {
        $this->assignPlan($employer, $package);
    }

    private function assignPlan(User $employer, Package $package): void
    {
        $plan = EmployerPackage::tryFrom($package->slug);

        $employer->forceFill([
            'package' => $plan ?? $employer->package,
            'subscription_status' => SubscriptionStatus::Active,
            'subscription_ends_at' => now()->addMonth(),
            'pending_package' => null,
            'pending_package_at' => null,
        ])->save();
    }
}
