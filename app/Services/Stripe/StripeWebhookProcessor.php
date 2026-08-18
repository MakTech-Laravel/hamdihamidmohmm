<?php

namespace App\Services\Stripe;

use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Models\User;
use App\Support\EmployerPlanSnapshot;

class StripeWebhookProcessor
{
    public function __construct(private StripeGateway $gateway, private StripeSubscriptionService $subscriptions) {}

    public function handle(string $payload, string $signature): void
    {
        $event = $this->gateway->constructEvent($payload, $signature);
        $object = $event['data']['object'];

        match ($event['type']) {
            'checkout.session.completed', 'checkout.session.async_payment_succeeded' => $this->subscriptions->fulfillCheckoutSession($object),
            'invoice.paid' => $this->handleInvoicePaid($object),
            'customer.subscription.updated', 'customer.subscription.deleted' => $this->subscriptions->syncSubscription($this->subscriptionFromObject($object)),
            default => null,
        };
    }

    /**
     * @param  array<string, mixed>  $invoice
     */
    private function handleInvoicePaid(array $invoice): void
    {
        $invoiceId = is_string($invoice['id'] ?? null) ? $invoice['id'] : null;
        $subscriptionId = $this->stringId($invoice['subscription'] ?? null);
        $customerId = $this->stringId($invoice['customer'] ?? null);
        $hostedUrl = is_string($invoice['hosted_invoice_url'] ?? null) ? $invoice['hosted_invoice_url'] : null;
        $paymentIntentId = $this->stringId($invoice['payment_intent'] ?? null);

        if ($invoiceId !== null) {
            $existing = Payment::query()->where('stripe_invoice_id', $invoiceId)->first();

            if ($existing instanceof Payment) {
                $existing->forceFill([
                    'status' => PaymentStatus::Completed,
                    'paid_at' => $existing->paid_at ?? now(),
                    'invoice_url' => $hostedUrl ?? $existing->invoice_url,
                    'stripe_payment_intent_id' => $paymentIntentId ?? $existing->stripe_payment_intent_id,
                    'stripe_subscription_id' => $subscriptionId ?? $existing->stripe_subscription_id,
                ])->save();

                return;
            }
        }

        $payment = $this->matchingPendingPayment($subscriptionId, $customerId);

        if ($payment instanceof Payment) {
            $payment->forceFill([
                'stripe_invoice_id' => $invoiceId ?? $payment->stripe_invoice_id,
                'invoice_url' => $hostedUrl ?? $payment->invoice_url,
                'stripe_payment_intent_id' => $paymentIntentId ?? $payment->stripe_payment_intent_id,
                'stripe_subscription_id' => $subscriptionId ?? $payment->stripe_subscription_id,
            ])->save();

            if (filled($payment->stripe_checkout_session_id) && $payment->status !== PaymentStatus::Completed) {
                $this->subscriptions->fulfillSessionId((string) $payment->stripe_checkout_session_id);
            }

            return;
        }

        if (! $this->isRenewalInvoice($invoice) && $subscriptionId !== null) {
            $completed = Payment::query()
                ->where('stripe_subscription_id', $subscriptionId)
                ->where('status', PaymentStatus::Completed)
                ->latest()
                ->first();

            if ($completed instanceof Payment) {
                $completed->forceFill([
                    'stripe_invoice_id' => $invoiceId ?? $completed->stripe_invoice_id,
                    'invoice_url' => $hostedUrl ?? $completed->invoice_url,
                    'stripe_payment_intent_id' => $paymentIntentId ?? $completed->stripe_payment_intent_id,
                ])->save();
            }

            return;
        }

        $employer = $this->employerFromInvoice($subscriptionId, $customerId);

        if (! $employer instanceof User || $invoiceId === null || $subscriptionId === null || ! $this->isRenewalInvoice($invoice)) {
            return;
        }

        $this->subscriptions->applyPendingPlan($employer);
        $employer->refresh();
        $this->subscriptions->syncSubscription($this->gateway->retrieveSubscription((string) $subscriptionId));

        Payment::query()->create([
            'employer_id' => $employer->id,
            'package_id' => $this->packageIdFor($employer),
            'amount' => $this->majorAmount($invoice, $employer),
            'currency' => strtoupper((string) ($invoice['currency'] ?? $employer->payments()->latest()->value('currency') ?? 'SAR')),
            'method' => 'stripe',
            'status' => PaymentStatus::Completed,
            'reference' => is_string($invoice['number'] ?? null) ? $invoice['number'] : $invoiceId,
            'paid_at' => now(),
            'stripe_invoice_id' => $invoiceId,
            'stripe_subscription_id' => $subscriptionId,
            'stripe_payment_intent_id' => $paymentIntentId,
            'invoice_url' => $hostedUrl,
        ]);
    }

    private function matchingPendingPayment(?string $subscriptionId, ?string $customerId): ?Payment
    {
        if ($subscriptionId !== null) {
            $bySubscription = Payment::query()
                ->where('stripe_subscription_id', $subscriptionId)
                ->where('status', PaymentStatus::Pending)
                ->latest()
                ->first();

            if ($bySubscription instanceof Payment) {
                return $bySubscription;
            }
        }

        $employer = $this->employerFromInvoice($subscriptionId, $customerId);

        if (! $employer instanceof User) {
            return null;
        }

        return Payment::query()
            ->where('employer_id', $employer->id)
            ->where('method', 'stripe')
            ->where('status', PaymentStatus::Pending)
            ->latest()
            ->first();
    }

    private function employerFromInvoice(?string $subscriptionId, ?string $customerId): ?User
    {
        if ($subscriptionId !== null) {
            $employer = User::query()->where('stripe_subscription_id', $subscriptionId)->first();

            if ($employer instanceof User) {
                return $employer;
            }
        }

        if ($customerId !== null) {
            return User::query()->where('stripe_customer_id', $customerId)->first();
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $invoice
     */
    private function isRenewalInvoice(array $invoice): bool
    {
        return ($invoice['billing_reason'] ?? null) === 'subscription_cycle';
    }

    /**
     * @param  array<string, mixed>  $object
     * @return array<string, mixed>
     */
    private function subscriptionFromObject(array $object): array
    {
        $itemId = null;
        $priceId = null;
        $periodEnd = is_int($object['current_period_end'] ?? null) ? $object['current_period_end'] : null;
        $items = $object['items']['data'] ?? null;

        if (is_array($items) && isset($items[0]) && is_array($items[0])) {
            $itemId = is_string($items[0]['id'] ?? null) ? $items[0]['id'] : null;
            $periodEnd ??= is_int($items[0]['current_period_end'] ?? null) ? $items[0]['current_period_end'] : null;
            $price = $items[0]['price'] ?? null;
            $priceId = is_string($price) ? $price : (is_array($price) && is_string($price['id'] ?? null) ? $price['id'] : null);
        }

        return [
            'id' => $object['id'] ?? null,
            'status' => $object['status'] ?? null,
            'customer' => $this->stringId($object['customer'] ?? null),
            'current_period_end' => $periodEnd,
            'item_id' => $itemId,
            'price_id' => $priceId,
            'schedule_id' => $this->stringId($object['schedule'] ?? null),
            'cancel_at_period_end' => (bool) ($object['cancel_at_period_end'] ?? false),
        ];
    }

    /**
     * @param  array<string, mixed>  $invoice
     */
    private function majorAmount(array $invoice, User $employer): int
    {
        $amountPaid = $invoice['amount_paid'] ?? $invoice['amount_due'] ?? null;

        if (! is_int($amountPaid)) {
            return (int) ($employer->payments()->latest()->value('amount') ?? 0);
        }

        return StripeMoney::toMajorAmount($amountPaid, (string) ($invoice['currency'] ?? 'sar'));
    }

    private function packageIdFor(User $employer): ?int
    {
        return EmployerPlanSnapshot::catalogPackage($employer->package)?->id
            ?? $employer->payments()
                ->where('status', PaymentStatus::Completed)
                ->latest('paid_at')
                ->value('package_id');
    }

    private function stringId(mixed $value): ?string
    {
        if (is_string($value) && $value !== '') {
            return $value;
        }

        if (is_array($value) && is_string($value['id'] ?? null)) {
            return $value['id'];
        }

        return null;
    }
}
