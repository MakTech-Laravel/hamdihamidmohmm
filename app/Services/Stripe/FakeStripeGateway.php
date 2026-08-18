<?php

namespace App\Services\Stripe;

use Illuminate\Support\Str;
use RuntimeException;

class FakeStripeGateway implements StripeGateway
{
    /**
     * @var array<string, array<string, mixed>>
     */
    private static array $sessions = [];

    /**
     * @var array<string, array<string, mixed>>
     */
    private static array $subscriptions = [];

    /**
     * @var array<string, array<string, mixed>>
     */
    private static array $schedules = [];

    public function enabled(): bool
    {
        return true;
    }

    public static function reset(): void
    {
        self::$sessions = [];
        self::$subscriptions = [];
        self::$schedules = [];
    }

    /**
     * @param  array<string, mixed>  $params
     * @return array{id: string}
     */
    public function createCustomer(array $params): array
    {
        return ['id' => 'cus_test_'.Str::lower(Str::random(14))];
    }

    /**
     * @param  array<string, mixed>  $params
     * @return array{id: string}
     */
    public function createProduct(array $params): array
    {
        return ['id' => 'prod_test_'.Str::lower(Str::random(14))];
    }

    /**
     * @param  array<string, mixed>  $params
     * @return array{id: string}
     */
    public function updateProduct(string $id, array $params): array
    {
        return ['id' => $id];
    }

    /**
     * @param  array<string, mixed>  $params
     * @return array{id: string}
     */
    public function createPrice(array $params): array
    {
        return ['id' => 'price_test_'.Str::lower(Str::random(14))];
    }

    /**
     * @param  array<string, mixed>  $params
     * @return array{id: string, url: string}
     */
    public function createCheckoutSession(array $params): array
    {
        $id = 'cs_test_'.Str::lower(Str::random(24));
        $subscriptionId = 'sub_test_'.Str::lower(Str::random(14));
        $metadata = $this->stringMap($params['metadata'] ?? []);

        $invoiceId = 'in_test_'.Str::lower(Str::random(14));

        $priceId = is_string($params['line_items'][0]['price'] ?? null)
            ? $params['line_items'][0]['price']
            : 'price_test_'.Str::lower(Str::random(14));

        self::$sessions[$id] = [
            'id' => $id,
            'status' => 'complete',
            'payment_status' => 'paid',
            'customer' => is_string($params['customer'] ?? null) ? $params['customer'] : null,
            'subscription' => $subscriptionId,
            'invoice' => $invoiceId,
            'payment_intent' => 'pi_test_'.Str::lower(Str::random(14)),
            'invoice_url' => 'https://invoice.stripe.test/'.$invoiceId,
            'metadata' => $metadata,
        ];

        self::$subscriptions[$subscriptionId] = [
            'id' => $subscriptionId,
            'status' => 'active',
            'customer' => is_string($params['customer'] ?? null) ? $params['customer'] : null,
            'current_period_start' => now()->timestamp,
            'current_period_end' => now()->addMonth()->timestamp,
            'item_id' => 'si_test_'.Str::lower(Str::random(14)),
            'price_id' => $priceId,
            'schedule_id' => null,
            'cancel_at_period_end' => false,
        ];

        return [
            'id' => $id,
            'url' => 'https://checkout.stripe.test/c/pay/'.$id,
        ];
    }

    /**
     * @return array{
     *     id: string,
     *     status: string,
     *     payment_status: string,
     *     customer: string|null,
     *     subscription: string|null,
     *     invoice: string|null,
     *     payment_intent: string|null,
     *     invoice_url: string|null,
     *     metadata: array<string, string>
     * }
     */
    public function retrieveCheckoutSession(string $id): array
    {
        $session = self::$sessions[$id] ?? null;

        if (! is_array($session)) {
            throw new RuntimeException("Unknown checkout session [{$id}].");
        }

        return [
            'id' => $id,
            'status' => (string) ($session['status'] ?? 'complete'),
            'payment_status' => (string) ($session['payment_status'] ?? 'paid'),
            'customer' => is_string($session['customer'] ?? null) ? $session['customer'] : null,
            'subscription' => is_string($session['subscription'] ?? null) ? $session['subscription'] : null,
            'invoice' => is_string($session['invoice'] ?? null) ? $session['invoice'] : null,
            'payment_intent' => is_string($session['payment_intent'] ?? null) ? $session['payment_intent'] : null,
            'invoice_url' => is_string($session['invoice_url'] ?? null) ? $session['invoice_url'] : null,
            'metadata' => $this->stringMap($session['metadata'] ?? []),
        ];
    }

    /**
     * @param  array<string, mixed>  $params
     * @return array{id: string, url: string}
     */
    public function createBillingPortalSession(array $params): array
    {
        return [
            'id' => 'bps_test_'.Str::lower(Str::random(14)),
            'url' => 'https://billing.stripe.test/session/'.Str::lower(Str::random(12)),
        ];
    }

    /**
     * @return array{
     *     id: string,
     *     status: string,
     *     customer: string|null,
     *     current_period_start: int|null,
     *     current_period_end: int|null,
     *     item_id: string|null,
     *     price_id: string|null,
     *     schedule_id: string|null,
     *     cancel_at_period_end: bool
     * }
     */
    public function retrieveSubscription(string $id): array
    {
        $subscription = self::$subscriptions[$id] ?? [
            'id' => $id,
            'status' => 'active',
            'customer' => null,
            'current_period_start' => now()->timestamp,
            'current_period_end' => now()->addMonth()->timestamp,
            'item_id' => 'si_test_'.Str::lower(Str::random(14)),
            'price_id' => null,
            'schedule_id' => null,
            'cancel_at_period_end' => false,
        ];

        return $this->subscriptionPayload($subscription);
    }

    /**
     * @param  array<string, mixed>  $params
     * @return array{
     *     id: string,
     *     status: string,
     *     customer: string|null,
     *     current_period_start: int|null,
     *     current_period_end: int|null,
     *     item_id: string|null,
     *     price_id: string|null,
     *     schedule_id: string|null,
     *     cancel_at_period_end: bool
     * }
     */
    public function updateSubscription(string $id, array $params): array
    {
        $current = $this->retrieveSubscription($id);
        $priceId = is_string($params['items'][0]['price'] ?? null)
            ? $params['items'][0]['price']
            : $current['price_id'];

        $updated = [
            ...$current,
            'status' => 'active',
            'price_id' => $priceId,
            'cancel_at_period_end' => (bool) ($params['cancel_at_period_end'] ?? false),
            'current_period_end' => $current['current_period_end'] ?? now()->addMonth()->timestamp,
        ];

        if (($params['cancel_at_period_end'] ?? false) !== true) {
            $updated['schedule_id'] = null;
        }

        self::$subscriptions[$id] = $updated;

        return $this->subscriptionPayload($updated);
    }

    /**
     * @return array{
     *     id: string,
     *     subscription: string|null,
     *     current_period_start: int|null,
     *     current_period_end: int|null,
     *     price_id: string|null
     * }
     */
    public function createSubscriptionScheduleFromSubscription(string $subscriptionId): array
    {
        $subscription = $this->retrieveSubscription($subscriptionId);
        $existingId = $subscription['schedule_id'];

        if (is_string($existingId) && $existingId !== '' && isset(self::$schedules[$existingId])) {
            return $this->schedulePayload(self::$schedules[$existingId], $subscription);
        }

        $id = 'sub_sched_test_'.Str::lower(Str::random(12));
        $schedule = [
            'id' => $id,
            'subscription' => $subscriptionId,
            'price_id' => $subscription['price_id'],
            'current_period_start' => $subscription['current_period_start'],
            'current_period_end' => $subscription['current_period_end'],
        ];

        self::$schedules[$id] = $schedule;
        self::$subscriptions[$subscriptionId] = [
            ...$subscription,
            'schedule_id' => $id,
        ];

        return $this->schedulePayload($schedule, $subscription);
    }

    /**
     * @param  array<string, mixed>  $params
     * @return array{id: string, subscription: string|null}
     */
    public function updateSubscriptionSchedule(string $id, array $params): array
    {
        $schedule = self::$schedules[$id] ?? null;

        if (! is_array($schedule)) {
            throw new RuntimeException("Unknown subscription schedule [{$id}].");
        }

        $pendingPrice = is_string($params['phases'][1]['items'][0]['price'] ?? null)
            ? $params['phases'][1]['items'][0]['price']
            : ($schedule['pending_price_id'] ?? null);

        $schedule['pending_price_id'] = $pendingPrice;
        self::$schedules[$id] = $schedule;

        return [
            'id' => $id,
            'subscription' => is_string($schedule['subscription'] ?? null) ? $schedule['subscription'] : null,
        ];
    }

    /**
     * @return array{id: string}
     */
    public function releaseSubscriptionSchedule(string $id): array
    {
        $schedule = self::$schedules[$id] ?? null;
        $subscriptionId = is_array($schedule) && is_string($schedule['subscription'] ?? null)
            ? $schedule['subscription']
            : null;

        unset(self::$schedules[$id]);

        if ($subscriptionId !== null && isset(self::$subscriptions[$subscriptionId])) {
            self::$subscriptions[$subscriptionId]['schedule_id'] = null;
        }

        return ['id' => $id];
    }

    /**
     * @return array{id: string, type: string, data: array{object: array<string, mixed>}}
     */
    public function constructEvent(string $payload, string $signature): array
    {
        $decoded = json_decode($payload, true);

        if (! is_array($decoded) || ! is_string($decoded['type'] ?? null)) {
            throw new RuntimeException('Invalid Stripe event payload.');
        }

        /** @var array<string, mixed> $object */
        $object = is_array($decoded['data']['object'] ?? null) ? $decoded['data']['object'] : [];

        return [
            'id' => is_string($decoded['id'] ?? null) ? $decoded['id'] : 'evt_test',
            'type' => $decoded['type'],
            'data' => ['object' => $object],
        ];
    }

    /**
     * @return array<string, string>
     */
    private function stringMap(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        $mapped = [];

        foreach ($value as $key => $item) {
            if (is_string($key) && (is_string($item) || is_numeric($item))) {
                $mapped[$key] = (string) $item;
            }
        }

        return $mapped;
    }

    /**
     * @param  array<string, mixed>  $subscription
     * @return array{
     *     id: string,
     *     status: string,
     *     customer: string|null,
     *     current_period_start: int|null,
     *     current_period_end: int|null,
     *     item_id: string|null,
     *     price_id: string|null,
     *     schedule_id: string|null,
     *     cancel_at_period_end: bool
     * }
     */
    private function subscriptionPayload(array $subscription): array
    {
        return [
            'id' => (string) ($subscription['id'] ?? ''),
            'status' => (string) ($subscription['status'] ?? 'active'),
            'customer' => is_string($subscription['customer'] ?? null) ? $subscription['customer'] : null,
            'current_period_start' => is_int($subscription['current_period_start'] ?? null)
                ? $subscription['current_period_start']
                : now()->timestamp,
            'current_period_end' => is_int($subscription['current_period_end'] ?? null)
                ? $subscription['current_period_end']
                : now()->addMonth()->timestamp,
            'item_id' => is_string($subscription['item_id'] ?? null) ? $subscription['item_id'] : null,
            'price_id' => is_string($subscription['price_id'] ?? null) ? $subscription['price_id'] : null,
            'schedule_id' => is_string($subscription['schedule_id'] ?? null) ? $subscription['schedule_id'] : null,
            'cancel_at_period_end' => (bool) ($subscription['cancel_at_period_end'] ?? false),
        ];
    }

    /**
     * @param  array<string, mixed>  $schedule
     * @param  array<string, mixed>  $subscription
     * @return array{
     *     id: string,
     *     subscription: string|null,
     *     current_period_start: int|null,
     *     current_period_end: int|null,
     *     price_id: string|null
     * }
     */
    private function schedulePayload(array $schedule, array $subscription): array
    {
        return [
            'id' => (string) ($schedule['id'] ?? ''),
            'subscription' => is_string($schedule['subscription'] ?? null) ? $schedule['subscription'] : null,
            'current_period_start' => is_int($schedule['current_period_start'] ?? null)
                ? $schedule['current_period_start']
                : (is_int($subscription['current_period_start'] ?? null) ? $subscription['current_period_start'] : now()->timestamp),
            'current_period_end' => is_int($schedule['current_period_end'] ?? null)
                ? $schedule['current_period_end']
                : (is_int($subscription['current_period_end'] ?? null) ? $subscription['current_period_end'] : now()->addMonth()->timestamp),
            'price_id' => is_string($schedule['price_id'] ?? null)
                ? $schedule['price_id']
                : (is_string($subscription['price_id'] ?? null) ? $subscription['price_id'] : null),
        ];
    }
}
