<?php

namespace App\Services\YallaPay;

use App\Enums\EmployerPackage;
use App\Enums\PaymentStatus;
use App\Enums\SubscriptionStatus;
use App\Models\Package;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;

class YallaPayPackageCheckoutService
{
    public const MINIMUM_AMOUNT = 1000;

    public function __construct(private YallaPayService $yallaPay) {}

    public function enabled(): bool
    {
        return $this->yallaPay->enabled();
    }

    /**
     * @return array{status: string, url?: string, message: string}
     */
    public function startCheckout(User $employer, Package $package): array
    {
        abort_unless($package->is_active && $package->is_public, 404);

        $plan = EmployerPackage::tryFrom($package->slug);
        abort_unless($plan instanceof EmployerPackage, 422);

        if ($employer->package === $plan && $employer->subscription_status?->isActive()) {
            return [
                'status' => 'already',
                'message' => 'This is already your current plan.',
            ];
        }

        if ($package->price < 1) {
            throw new RuntimeException('Complimentary plans should use the free checkout path.');
        }

        if (! $this->enabled()) {
            throw new RuntimeException('YallaPay is not configured. Add YALLAPAY_AUTH_TOKEN to the .env file.');
        }

        if ($package->price < self::MINIMUM_AMOUNT) {
            throw new RuntimeException(
                'YallaPay requires a minimum of '.self::MINIMUM_AMOUNT.' SDG. Update this package price in admin, then try again.'
            );
        }

        $reference = (string) Str::uuid();

        $payment = Payment::query()->create([
            'employer_id' => $employer->id,
            'package_id' => $package->id,
            'amount' => $package->price,
            'currency' => $package->currency ?: 'SDG',
            'method' => 'yallapay',
            'status' => PaymentStatus::Pending,
            'reference' => $reference,
        ]);

        $successUrl = route('employer.packages.checkout.success', [
            'provider' => 'yallapay',
            'reference' => $reference,
        ], true);

        $failedUrl = route('employer.packages', ['checkout' => 'canceled'], true);

        try {
            $result = $this->yallaPay->createPayment([
                'amount' => $package->price,
                'reference' => $reference,
                'description' => 'Package: '.($package->name ?: $package->slug),
                'success_url' => $successUrl,
                'failed_url' => $failedUrl,
            ]);
        } catch (RuntimeException $exception) {
            $payment->delete();

            Log::warning('YallaPay package checkout failed', [
                'reference' => $reference,
                'message' => $exception->getMessage(),
            ]);

            throw new RuntimeException($exception->getMessage());
        }

        if ($this->yallaPay->isSuccessfulResponse($result)) {
            return [
                'status' => 'redirect',
                'url' => (string) $result['paymentUrl'],
                'message' => 'Redirecting to YallaPay…',
            ];
        }

        $payment->delete();

        Log::warning('YallaPay package checkout rejected', [
            'reference' => $reference,
            'result' => $result,
        ]);

        throw new RuntimeException((string) ($result['responseMessage'] ?? 'YallaPay payment failed to initiate.'));
    }

    public function fulfillByReference(string $reference): bool
    {
        $payment = Payment::query()
            ->where('reference', $reference)
            ->where('method', 'yallapay')
            ->first();

        if (! $payment instanceof Payment) {
            return false;
        }

        return $this->fulfillPayment($payment);
    }

    public function fulfillPayment(Payment $payment): bool
    {
        if ($payment->method !== 'yallapay') {
            return false;
        }

        if ($payment->status === PaymentStatus::Completed) {
            $this->ensurePlanAssigned($payment);

            return true;
        }

        if ($payment->status !== PaymentStatus::Pending) {
            return false;
        }

        $payment->forceFill([
            'status' => PaymentStatus::Completed,
            'paid_at' => $payment->paid_at ?? now(),
        ])->save();

        $this->ensurePlanAssigned($payment);

        return true;
    }

    public function markFailed(Payment $payment): void
    {
        if ($payment->method !== 'yallapay' || $payment->status !== PaymentStatus::Pending) {
            return;
        }

        $payment->forceFill(['status' => PaymentStatus::Failed])->save();
    }

    /**
     * Confirm via YallaPay status API when the customer returns from checkout (webhook may lag).
     */
    public function confirmFromRedirect(string $reference): bool
    {
        $payment = Payment::query()
            ->where('reference', $reference)
            ->where('method', 'yallapay')
            ->first();

        if (! $payment instanceof Payment) {
            return false;
        }

        if ($payment->status === PaymentStatus::Completed) {
            $this->ensurePlanAssigned($payment);

            return true;
        }

        try {
            $status = $this->yallaPay->getPaymentStatus(
                $reference,
                ($payment->created_at ?? now())->format('Y-m-d'),
            );
        } catch (RequestException $exception) {
            Log::warning('YallaPay getPaymentStatus failed on redirect', [
                'reference' => $reference,
                'message' => $exception->getMessage(),
            ]);

            return false;
        }

        $normalized = strtolower((string) ($status['status'] ?? $status['paymentStatus'] ?? ''));
        $isSuccessful = in_array($normalized, ['success', 'successful', 'paid', 'completed'], true)
            || (string) ($status['responseCode'] ?? '') === '0';

        if (! $isSuccessful) {
            return false;
        }

        return $this->fulfillPayment($payment);
    }

    private function ensurePlanAssigned(Payment $payment): void
    {
        $package = $payment->package;
        $employer = $payment->employer;

        if (! $package instanceof Package || ! $employer instanceof User) {
            return;
        }

        $plan = EmployerPackage::tryFrom($package->slug);

        if ($plan instanceof EmployerPackage && $employer->package === $plan && $employer->subscription_status?->isActive()) {
            return;
        }

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
