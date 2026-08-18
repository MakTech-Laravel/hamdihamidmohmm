<?php

namespace App\Services\Stripe;

use App\Enums\EmployerPackage;
use App\Enums\PaymentStatus;
use App\Enums\PlanChangeAction;
use App\Enums\SubscriptionStatus;
use App\Models\Package;
use App\Models\Payment;
use App\Models\User;
use App\Support\EmployerPlanChange;
use App\Support\EmployerPlanSnapshot;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use RuntimeException;

class StripeSubscriptionService
{
    public function __construct(private StripeGateway $gateway) {}

    public function enabled(): bool
    {
        return $this->gateway->enabled();
    }

    /**
     * @return array{status: string, url?: string, message: string}
     */
    public function startCheckout(User $employer, Package $package): array
    {
        abort_unless($package->is_active && $package->is_public, 404);

        $plan = EmployerPackage::tryFrom($package->slug);
        abort_unless($plan instanceof EmployerPackage, 422);

        if ($employer->package === $plan && ($package->price < 1 || $employer->subscription_status?->isActive())) {
            return [
                'status' => 'already',
                'message' => 'This is already your current plan.',
            ];
        }

        if ($package->price < 1) {
            if (filled($employer->stripe_subscription_id) && $employer->subscription_status?->isActive()) {
                return $this->scheduleDowngrade($employer, $package);
            }

            $this->activatePlan($employer, $package, [
                'method' => 'complimentary',
                'status' => PaymentStatus::Completed,
                'paid_at' => now(),
            ]);

            $this->assignPlan($employer, $package, [
                'subscription_status' => SubscriptionStatus::Active,
                'subscription_ends_at' => now()->addMonth(),
                'pending_package' => null,
                'pending_package_at' => null,
                'stripe_schedule_id' => null,
            ]);

            return [
                'status' => 'complimentary',
                'message' => 'Your complimentary plan is now active.',
            ];
        }

        if (! $this->gateway->enabled()) {
            throw new RuntimeException('Stripe is not configured. Add your test-mode STRIPE_SECRET to the .env file.');
        }

        if (filled($employer->stripe_subscription_id) && $employer->subscription_status?->isActive()) {
            return $this->switchSubscription($employer, $package);
        }

        $this->syncPackagePrice($package);

        $customerId = $this->ensureCustomer($employer);
        $priceId = $package->stripe_price_id;

        if (! is_string($priceId) || $priceId === '') {
            throw new RuntimeException('This package is missing a Stripe price. Save the package again from admin.');
        }

        $payment = Payment::query()->create([
            'employer_id' => $employer->id,
            'package_id' => $package->id,
            'amount' => $package->price,
            'currency' => $package->currency,
            'method' => 'stripe',
            'status' => PaymentStatus::Pending,
            'reference' => $this->reference(),
        ]);

        $session = $this->gateway->createCheckoutSession([
            'mode' => 'subscription',
            'customer' => $customerId,
            'client_reference_id' => (string) $employer->id,
            'success_url' => route('employer.packages.checkout.success', [], true) . '?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => route('employer.packages', ['checkout' => 'canceled'], true),
            'line_items' => [
                [
                    'price' => $priceId,
                    'quantity' => 1,
                ],
            ],
            'subscription_data' => [
                'metadata' => [
                    'employer_id' => (string) $employer->id,
                    'package_id' => (string) $package->id,
                    'package_slug' => $package->slug,
                    'payment_id' => (string) $payment->id,
                ],
            ],
            'metadata' => [
                'employer_id' => (string) $employer->id,
                'package_id' => (string) $package->id,
                'package_slug' => $package->slug,
                'payment_id' => (string) $payment->id,
            ],
            'allow_promotion_codes' => true,
            'billing_address_collection' => 'auto',
            'integration_identifier' => 'employer-checkout-' . Str::lower(Str::random(8)),
        ]);

        $payment->forceFill([
            'stripe_checkout_session_id' => $session['id'],
        ])->save();

        return [
            'status' => 'redirect',
            'url' => $session['url'],
            'message' => 'Redirecting to Stripe Checkout.',
        ];
    }

    public function billingPortalUrl(User $employer): string
    {
        if (! $this->gateway->enabled()) {
            throw new RuntimeException('Stripe is not configured. Add your test-mode STRIPE_SECRET to the .env file.');
        }

        $customerId = $employer->stripe_customer_id;

        if (! is_string($customerId) || $customerId === '') {
            throw new RuntimeException('No Stripe billing customer is attached to this account yet.');
        }

        $session = $this->gateway->createBillingPortalSession([
            'customer' => $customerId,
            'return_url' => route('employer.packages', [], true),
        ]);

        return $session['url'];
    }

    /**
     * @param  array<string, mixed>  $session
     */
    public function fulfillCheckoutSession(array $session): void
    {
        if (($session['payment_status'] ?? null) !== 'paid' && ($session['status'] ?? null) !== 'complete') {
            return;
        }

        $payment = $this->paymentFromSession($session);

        if ($payment === null) {
            return;
        }

        if ($payment->status === PaymentStatus::Completed) {
            $this->syncEmployerFromSession($payment, $session);

            return;
        }

        $package = $payment->package;

        if (! $package instanceof Package) {
            return;
        }

        $employer = $payment->employer;

        if (! $employer instanceof User) {
            return;
        }

        $subscriptionId = is_string($session['subscription'] ?? null) ? $session['subscription'] : null;
        $endsAt = $this->periodEndFromSubscription($subscriptionId);

        $payment->forceFill([
            'status' => PaymentStatus::Completed,
            'paid_at' => now(),
            'method' => 'stripe',
            'stripe_checkout_session_id' => is_string($session['id'] ?? null) ? $session['id'] : $payment->stripe_checkout_session_id,
            'stripe_subscription_id' => $subscriptionId,
            'stripe_invoice_id' => is_string($session['invoice'] ?? null) ? $session['invoice'] : $payment->stripe_invoice_id,
            'stripe_payment_intent_id' => is_string($session['payment_intent'] ?? null) ? $session['payment_intent'] : $payment->stripe_payment_intent_id,
            'invoice_url' => is_string($session['invoice_url'] ?? null) ? $session['invoice_url'] : $payment->invoice_url,
        ])->save();

        $this->assignPlan($employer, $package, [
            'stripe_customer_id' => is_string($session['customer'] ?? null) ? $session['customer'] : $employer->stripe_customer_id,
            'stripe_subscription_id' => $subscriptionId,
            'subscription_status' => SubscriptionStatus::Active,
            'subscription_ends_at' => $endsAt,
        ]);
    }

    public function fulfillSessionId(string $sessionId): void
    {
        $this->fulfillCheckoutSession($this->gateway->retrieveCheckoutSession($sessionId));
    }

    /**
     * @param  array<string, mixed>  $subscription
     */
    public function syncSubscription(array $subscription): void
    {
        $subscriptionId = is_string($subscription['id'] ?? null) ? $subscription['id'] : null;

        if ($subscriptionId === null) {
            return;
        }

        $employer = User::query()->where('stripe_subscription_id', $subscriptionId)->first();

        if ($employer === null) {
            $customerId = is_string($subscription['customer'] ?? null) ? $subscription['customer'] : null;

            if ($customerId !== null) {
                $employer = User::query()->where('stripe_customer_id', $customerId)->first();
            }
        }

        if ($employer === null) {
            return;
        }

        $status = SubscriptionStatus::fromStripe(is_string($subscription['status'] ?? null) ? $subscription['status'] : null);
        $endsAt = $this->timestampToCarbon($subscription['current_period_end'] ?? null);
        $priceId = is_string($subscription['price_id'] ?? null) ? $subscription['price_id'] : null;
        $catalog = $priceId !== null
            ? Package::query()->where('stripe_price_id', $priceId)->first()
            : null;

        $attributes = [
            'subscription_status' => $status,
            'subscription_ends_at' => $endsAt,
            'stripe_subscription_id' => $status === SubscriptionStatus::Canceled ? $employer->stripe_subscription_id : $subscriptionId,
        ];

        if ($catalog instanceof Package) {
            $plan = EmployerPackage::tryFrom($catalog->slug);

            if ($plan instanceof EmployerPackage && $employer->package !== $plan) {
                $attributes['package'] = $plan;
                $attributes['pending_package'] = null;
                $attributes['pending_package_at'] = null;
                $attributes['stripe_schedule_id'] = null;
            }
        } elseif ($status === SubscriptionStatus::Canceled && $employer->pending_package instanceof EmployerPackage) {
            $this->applyPendingPlan($employer);
            $employer->refresh();
        }

        $employer->forceFill($attributes)->save();
    }

    public function applyPendingPlan(User $employer): void
    {
        $pending = $employer->pending_package;

        if (! $pending instanceof EmployerPackage) {
            return;
        }

        $package = Package::query()->where('slug', $pending->value)->first();

        if (! $package instanceof Package) {
            $this->clearPendingChange($employer);

            return;
        }

        $this->assignPlan($employer, $package, [
            'subscription_status' => $package->price < 1
                ? SubscriptionStatus::Canceled
                : ($employer->subscription_status ?? SubscriptionStatus::Active),
            'pending_package' => null,
            'pending_package_at' => null,
            'stripe_schedule_id' => null,
        ]);
    }

    public function syncPackagePrice(Package $package): void
    {
        if (! $this->gateway->enabled() || $package->price < 1) {
            return;
        }

        $interval = StripeMoney::interval((string) $package->billing_period);
        $currency = strtolower((string) $package->currency);
        $unitAmount = StripeMoney::toUnitAmount((int) $package->price, (string) $package->currency);

        $productId = $package->stripe_product_id;

        if (! is_string($productId) || $productId === '') {
            $product = $this->gateway->createProduct([
                'name' => $package->name,
                'metadata' => [
                    'package_id' => (string) $package->id,
                    'package_slug' => $package->slug,
                ],
            ]);
            $productId = $product['id'];
        } else {
            $this->gateway->updateProduct($productId, [
                'name' => $package->name,
                'metadata' => [
                    'package_id' => (string) $package->id,
                    'package_slug' => $package->slug,
                ],
            ]);
        }

        $priceNeedsRefresh = $package->stripe_price_id === null
            || (int) $package->stripe_price_amount !== $unitAmount
            || strtolower((string) $package->stripe_price_currency) !== $currency
            || $package->stripe_price_interval !== $interval;

        $priceId = $package->stripe_price_id;

        if ($priceNeedsRefresh) {
            $price = $this->gateway->createPrice([
                'product' => $productId,
                'unit_amount' => $unitAmount,
                'currency' => $currency,
                'recurring' => [
                    'interval' => $interval,
                ],
                'metadata' => [
                    'package_id' => (string) $package->id,
                    'package_slug' => $package->slug,
                ],
            ]);
            $priceId = $price['id'];
        }

        $package->forceFill([
            'stripe_product_id' => $productId,
            'stripe_price_id' => $priceId,
            'stripe_price_amount' => $unitAmount,
            'stripe_price_currency' => $currency,
            'stripe_price_interval' => $interval,
        ])->save();
    }

    /**
     * @return array{status: string, message: string}
     */
    private function switchSubscription(User $employer, Package $package): array
    {
        $action = EmployerPlanChange::action(
            EmployerPlanSnapshot::catalogPackage($employer->package),
            $package,
        );

        if ($action === PlanChangeAction::Current) {
            return [
                'status' => 'already',
                'message' => 'This is already your current plan.',
            ];
        }

        if ($action === PlanChangeAction::Downgrade) {
            return $this->scheduleDowngrade($employer, $package);
        }

        return $this->upgradeSubscription($employer, $package);
    }

    /**
     * @return array{status: string, message: string}
     */
    private function upgradeSubscription(User $employer, Package $package): array
    {
        $this->releaseScheduledChange($employer);
        $this->syncPackagePrice($package);

        $subscriptionId = $employer->stripe_subscription_id;
        $priceId = $package->stripe_price_id;

        if (! is_string($subscriptionId) || $subscriptionId === '' || ! is_string($priceId) || $priceId === '') {
            throw new RuntimeException('Unable to update the current Stripe subscription.');
        }

        $current = $this->gateway->retrieveSubscription($subscriptionId);
        $itemId = $current['item_id'];
        $params = [
            'cancel_at_period_end' => false,
            'metadata' => [
                'employer_id' => (string) $employer->id,
                'package_id' => (string) $package->id,
                'package_slug' => $package->slug,
            ],
            'proration_behavior' => 'create_prorations',
        ];

        if (is_string($itemId) && $itemId !== '') {
            $params['items'] = [
                [
                    'id' => $itemId,
                    'price' => $priceId,
                ],
            ];
        }

        $updated = $this->gateway->updateSubscription($subscriptionId, $params);

        $this->activatePlan($employer, $package, [
            'method' => 'stripe',
            'status' => PaymentStatus::Completed,
            'paid_at' => now(),
            'stripe_subscription_id' => $updated['id'],
        ]);

        $this->assignPlan($employer, $package, [
            'stripe_subscription_id' => $updated['id'],
            'subscription_status' => SubscriptionStatus::fromStripe($updated['status']) ?? SubscriptionStatus::Active,
            'subscription_ends_at' => $this->timestampToCarbon($updated['current_period_end']),
            'pending_package' => null,
            'pending_package_at' => null,
            'stripe_schedule_id' => null,
        ]);

        return [
            'status' => 'upgraded',
            'message' => 'Your plan has been upgraded.',
        ];
    }

    /**
     * @return array{status: string, message: string}
     */
    private function scheduleDowngrade(User $employer, Package $package): array
    {
        $pendingPlan = EmployerPackage::tryFrom($package->slug);

        if ($employer->pending_package === $pendingPlan) {
            return [
                'status' => 'scheduled',
                'message' => $this->downgradeMessage($package, $employer->pending_package_at),
            ];
        }

        $subscriptionId = $employer->stripe_subscription_id;

        if (! is_string($subscriptionId) || $subscriptionId === '') {
            throw new RuntimeException('Unable to update the current Stripe subscription.');
        }

        $current = $this->gateway->retrieveSubscription($subscriptionId);
        $endsAt = $this->timestampToCarbon($current['current_period_end'])
            ?? $employer->subscription_ends_at
            ?? now()->addMonth();

        if ($package->price < 1) {
            $this->releaseScheduledChange($employer);
            $this->gateway->updateSubscription($subscriptionId, [
                'cancel_at_period_end' => true,
                'metadata' => [
                    'employer_id' => (string) $employer->id,
                    'package_id' => (string) $package->id,
                    'package_slug' => $package->slug,
                ],
            ]);
            $this->assignPendingChange($employer, $package, $endsAt, null);

            return [
                'status' => 'scheduled',
                'message' => $this->downgradeMessage($package, $endsAt),
            ];
        }

        $this->syncPackagePrice($package);
        $package->refresh();

        $priceId = $package->stripe_price_id;
        $currentPriceId = $current['price_id'];

        if (! is_string($priceId) || $priceId === '' || ! is_string($currentPriceId) || $currentPriceId === '') {
            throw new RuntimeException('Unable to schedule the plan change on Stripe.');
        }

        if ($current['cancel_at_period_end']) {
            $this->gateway->updateSubscription($subscriptionId, [
                'cancel_at_period_end' => false,
            ]);
        }

        $schedule = $this->gateway->createSubscriptionScheduleFromSubscription($subscriptionId);
        $this->gateway->updateSubscriptionSchedule($schedule['id'], [
            'end_behavior' => 'release',
            'phases' => [
                [
                    'items' => [
                        [
                            'price' => $currentPriceId,
                            'quantity' => 1,
                        ],
                    ],
                    'start_date' => $schedule['current_period_start'],
                    'end_date' => $schedule['current_period_end'],
                ],
                [
                    'items' => [
                        [
                            'price' => $priceId,
                            'quantity' => 1,
                        ],
                    ],
                ],
            ],
        ]);

        $changeAt = $this->timestampToCarbon($schedule['current_period_end']) ?? $endsAt;
        $this->assignPendingChange($employer, $package, $changeAt, $schedule['id']);

        return [
            'status' => 'scheduled',
            'message' => $this->downgradeMessage($package, $changeAt),
        ];
    }

    private function releaseScheduledChange(User $employer): void
    {
        if (filled($employer->stripe_schedule_id)) {
            try {
                $this->gateway->releaseSubscriptionSchedule((string) $employer->stripe_schedule_id);
            } catch (RuntimeException) {
            }
        }

        if (filled($employer->stripe_subscription_id)) {
            try {
                $current = $this->gateway->retrieveSubscription((string) $employer->stripe_subscription_id);

                if ($current['cancel_at_period_end']) {
                    $this->gateway->updateSubscription((string) $employer->stripe_subscription_id, [
                        'cancel_at_period_end' => false,
                    ]);
                }
            } catch (RuntimeException) {
            }
        }

        $this->clearPendingChange($employer);
    }

    private function assignPendingChange(User $employer, Package $package, mixed $changeAt, ?string $scheduleId): void
    {
        $employer->forceFill([
            'pending_package' => EmployerPackage::tryFrom($package->slug),
            'pending_package_at' => $changeAt,
            'stripe_schedule_id' => $scheduleId,
        ])->save();
    }

    private function clearPendingChange(User $employer): void
    {
        $employer->forceFill([
            'pending_package' => null,
            'pending_package_at' => null,
            'stripe_schedule_id' => null,
        ])->save();
    }

    private function downgradeMessage(Package $package, mixed $changeAt): string
    {
        $when = $changeAt instanceof CarbonInterface
            ? $changeAt->toFormattedDateString()
            : null;

        if ($when === null) {
            return "Your plan will switch to {$package->name} at the end of the current billing period. You keep your current plan until then.";
        }

        return "Your plan will switch to {$package->name} on {$when}. You keep your current plan until then.";
    }

    /**
     * @param  array<string, mixed>  $session
     */
    private function paymentFromSession(array $session): ?Payment
    {
        $sessionId = is_string($session['id'] ?? null) ? $session['id'] : null;
        $metadata = is_array($session['metadata'] ?? null) ? $session['metadata'] : [];
        $paymentId = is_string($metadata['payment_id'] ?? null) ? $metadata['payment_id'] : null;

        $query = Payment::query()->with(['package', 'employer']);

        if ($sessionId !== null) {
            $payment = (clone $query)->where('stripe_checkout_session_id', $sessionId)->first();

            if ($payment instanceof Payment) {
                return $payment;
            }
        }

        if ($paymentId !== null) {
            return $query->whereKey($paymentId)->first();
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $session
     */
    private function syncEmployerFromSession(Payment $payment, array $session): void
    {
        $employer = $payment->employer;
        $package = $payment->package;

        if (! $employer instanceof User || ! $package instanceof Package) {
            return;
        }

        $subscriptionId = is_string($session['subscription'] ?? null) ? $session['subscription'] : $employer->stripe_subscription_id;

        $this->assignPlan($employer, $package, [
            'stripe_customer_id' => is_string($session['customer'] ?? null) ? $session['customer'] : $employer->stripe_customer_id,
            'stripe_subscription_id' => $subscriptionId,
            'subscription_status' => $employer->subscription_status ?? SubscriptionStatus::Active,
            'subscription_ends_at' => $employer->subscription_ends_at ?? $this->periodEndFromSubscription($subscriptionId),
        ]);
    }

    /**
     * @param  array<string, mixed>  $paymentAttributes
     */
    private function activatePlan(User $employer, Package $package, array $paymentAttributes): void
    {
        Payment::query()->create([
            'employer_id' => $employer->id,
            'package_id' => $package->id,
            'amount' => $package->price,
            'currency' => $package->currency,
            'reference' => $this->reference(),
            ...$paymentAttributes,
        ]);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function assignPlan(User $employer, Package $package, array $attributes): void
    {
        $plan = EmployerPackage::tryFrom($package->slug);

        $employer->forceFill([
            ...$attributes,
            'package' => $plan ?? $employer->package,
        ])->save();
    }

    private function ensureCustomer(User $employer): string
    {
        if (filled($employer->stripe_customer_id)) {
            return (string) $employer->stripe_customer_id;
        }

        $customer = $this->gateway->createCustomer([
            'email' => $employer->email,
            'name' => $employer->company_name ?: $employer->name,
            'metadata' => [
                'employer_id' => (string) $employer->id,
            ],
        ]);

        $employer->forceFill([
            'stripe_customer_id' => $customer['id'],
        ])->save();

        return $customer['id'];
    }

    private function periodEndFromSubscription(?string $subscriptionId): ?CarbonInterface
    {
        if ($subscriptionId === null || $subscriptionId === '') {
            return now()->addMonth();
        }

        try {
            $subscription = $this->gateway->retrieveSubscription($subscriptionId);
        } catch (RuntimeException) {
            return now()->addMonth();
        }

        return $this->timestampToCarbon($subscription['current_period_end']) ?? now()->addMonth();
    }

    private function timestampToCarbon(mixed $value): ?CarbonInterface
    {
        if (! is_int($value) || $value <= 0) {
            return null;
        }

        return Carbon::createFromTimestamp($value);
    }

    private function reference(): string
    {
        return 'INV-' . now()->format('Y') . '-' . Str::upper(Str::random(6));
    }
}
