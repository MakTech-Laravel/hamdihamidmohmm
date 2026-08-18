<?php

namespace App\Services\Stripe;

use RuntimeException;
use Stripe\ApiRequestor;
use Stripe\Exception\ApiConnectionException;
use Stripe\Exception\ApiErrorException;
use Stripe\Exception\InvalidRequestException;
use Stripe\Exception\SignatureVerificationException;
use Stripe\HttpClient\CurlClient;
use Stripe\StripeClient;
use Stripe\Webhook;
use UnexpectedValueException;

class StripeSdkGateway implements StripeGateway
{
    public function __construct(private ?StripeClient $client = null) {}

    public function enabled(): bool
    {
        return filled(config('services.stripe.secret'));
    }

    /**
     * @param  array<string, mixed>  $params
     * @return array{id: string}
     */
    public function createCustomer(array $params): array
    {
        return $this->request(function () use ($params): array {
            $customer = $this->client()->customers->create($params);

            return ['id' => $customer->id];
        });
    }

    /**
     * @param  array<string, mixed>  $params
     * @return array{id: string}
     */
    public function createProduct(array $params): array
    {
        return $this->request(function () use ($params): array {
            $product = $this->client()->products->create($params);

            return ['id' => $product->id];
        });
    }

    /**
     * @param  array<string, mixed>  $params
     * @return array{id: string}
     */
    public function updateProduct(string $id, array $params): array
    {
        return $this->request(function () use ($id, $params): array {
            $product = $this->client()->products->update($id, $params);

            return ['id' => $product->id];
        });
    }

    /**
     * @param  array<string, mixed>  $params
     * @return array{id: string}
     */
    public function createPrice(array $params): array
    {
        return $this->request(function () use ($params): array {
            $price = $this->client()->prices->create($params);

            return ['id' => $price->id];
        });
    }

    /**
     * @param  array<string, mixed>  $params
     * @return array{id: string, url: string}
     */
    public function createCheckoutSession(array $params): array
    {
        return $this->request(function () use ($params): array {
            try {
                $session = $this->client()->checkout->sessions->create($params);
            } catch (InvalidRequestException $exception) {
                unset($params['integration_identifier']);
                $session = $this->client()->checkout->sessions->create($params);
            }
            $url = $session->url;

            if (! is_string($url) || $url === '') {
                throw new RuntimeException('Stripe Checkout did not return a payment URL.');
            }

            return [
                'id' => $session->id,
                'url' => $url,
            ];
        });
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
        return $this->request(function () use ($id): array {
            $session = $this->client()->checkout->sessions->retrieve($id, [
                'expand' => ['invoice'],
            ]);

            $invoice = $session->invoice;
            $invoiceUrl = null;

            if (is_object($invoice) && is_string($invoice->hosted_invoice_url ?? null)) {
                $invoiceUrl = $invoice->hosted_invoice_url;
            } elseif (is_string($invoice) && $invoice !== '') {
                try {
                    $fetched = $this->client()->invoices->retrieve($invoice);
                    $invoiceUrl = is_string($fetched->hosted_invoice_url ?? null)
                        ? $fetched->hosted_invoice_url
                        : null;
                } catch (InvalidRequestException) {
                    $invoiceUrl = null;
                }
            }

            return [
                'id' => $session->id,
                'status' => (string) $session->status,
                'payment_status' => (string) $session->payment_status,
                'customer' => $this->stringId($session->customer),
                'subscription' => $this->stringId($session->subscription),
                'invoice' => $this->stringId($session->invoice),
                'payment_intent' => $this->stringId($session->payment_intent),
                'invoice_url' => $invoiceUrl,
                'metadata' => $this->metadata($session->metadata),
            ];
        });
    }

    /**
     * @param  array<string, mixed>  $params
     * @return array{id: string, url: string}
     */
    public function createBillingPortalSession(array $params): array
    {
        return $this->request(function () use ($params): array {
            $session = $this->client()->billingPortal->sessions->create($params);

            return [
                'id' => $session->id,
                'url' => $session->url,
            ];
        });
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
        return $this->request(function () use ($id): array {
            $subscription = $this->client()->subscriptions->retrieve($id);

            return $this->subscriptionPayload($subscription);
        });
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
        return $this->request(function () use ($id, $params): array {
            $subscription = $this->client()->subscriptions->update($id, $params);

            return $this->subscriptionPayload($subscription);
        });
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
        return $this->request(function () use ($subscriptionId): array {
            $subscription = $this->retrieveSubscription($subscriptionId);
            $existingId = $subscription['schedule_id'];

            if (is_string($existingId) && $existingId !== '') {
                $schedule = $this->client()->subscriptionSchedules->retrieve($existingId);
            } else {
                $schedule = $this->client()->subscriptionSchedules->create([
                    'from_subscription' => $subscriptionId,
                ]);
            }

            $phase = $schedule->phases[0] ?? null;
            $item = is_object($phase) ? ($phase->items[0] ?? null) : null;

            return [
                'id' => (string) $schedule->id,
                'subscription' => $this->stringId($schedule->subscription ?? $subscriptionId),
                'current_period_start' => is_object($phase) && is_int($phase->start_date ?? null)
                    ? $phase->start_date
                    : $subscription['current_period_start'],
                'current_period_end' => is_object($phase) && is_int($phase->end_date ?? null)
                    ? $phase->end_date
                    : $subscription['current_period_end'],
                'price_id' => is_object($item) ? $this->stringId($item->price ?? null) : $subscription['price_id'],
            ];
        });
    }

    /**
     * @param  array<string, mixed>  $params
     * @return array{id: string, subscription: string|null}
     */
    public function updateSubscriptionSchedule(string $id, array $params): array
    {
        return $this->request(function () use ($id, $params): array {
            $schedule = $this->client()->subscriptionSchedules->update($id, $params);

            return [
                'id' => (string) $schedule->id,
                'subscription' => $this->stringId($schedule->subscription ?? null),
            ];
        });
    }

    /**
     * @return array{id: string}
     */
    public function releaseSubscriptionSchedule(string $id): array
    {
        return $this->request(function () use ($id): array {
            $schedule = $this->client()->subscriptionSchedules->release($id);

            return ['id' => (string) $schedule->id];
        });
    }

    /**
     * @return array{id: string, type: string, data: array{object: array<string, mixed>}}
     */
    public function constructEvent(string $payload, string $signature): array
    {
        $secret = (string) config('services.stripe.webhook_secret');

        if ($secret === '') {
            throw new RuntimeException('Stripe webhook secret is not configured.');
        }

        try {
            $event = Webhook::constructEvent($payload, $signature, $secret);
        } catch (SignatureVerificationException|UnexpectedValueException $exception) {
            throw new RuntimeException($exception->getMessage(), previous: $exception);
        }

        /** @var array<string, mixed> $object */
        $object = $event->data->object->toArray();

        return [
            'id' => $event->id,
            'type' => $event->type,
            'data' => ['object' => $object],
        ];
    }

    private function client(): StripeClient
    {
        if ($this->client instanceof StripeClient) {
            return $this->client;
        }

        $curl = new CurlClient([
            CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
        ]);
        $curl->setConnectTimeout(10);
        $curl->setTimeout(30);
        ApiRequestor::setHttpClient($curl);

        $this->client = new StripeClient([
            'api_key' => (string) config('services.stripe.secret'),
            'stripe_version' => (string) config('services.stripe.api_version'),
            'max_network_retries' => 2,
        ]);

        return $this->client;
    }

    /**
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T
     */
    private function request(callable $callback): mixed
    {
        try {
            return $callback();
        } catch (ApiConnectionException $exception) {
            throw new RuntimeException(
                'Could not reach Stripe. Check your internet connection, firewall, or VPN, then try again.',
                previous: $exception,
            );
        } catch (ApiErrorException $exception) {
            throw new RuntimeException($exception->getMessage(), previous: $exception);
        }
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
    private function subscriptionPayload(object $subscription): array
    {
        $items = $subscription->items->data ?? [];

        if (! is_array($items)) {
            $items = [];
        }

        $firstItem = $items[0] ?? null;
        $itemId = is_object($firstItem) && is_string($firstItem->id ?? null) ? $firstItem->id : null;
        $periodStart = $subscription->current_period_start ?? null;
        $periodEnd = $subscription->current_period_end ?? null;
        $priceId = null;

        if (is_object($firstItem)) {
            $periodStart = is_int($periodStart) ? $periodStart : ($firstItem->current_period_start ?? null);
            $periodEnd = is_int($periodEnd) ? $periodEnd : ($firstItem->current_period_end ?? null);
            $priceId = $this->stringId($firstItem->price ?? null);
        }

        return [
            'id' => (string) $subscription->id,
            'status' => (string) $subscription->status,
            'customer' => $this->stringId($subscription->customer ?? null),
            'current_period_start' => is_int($periodStart) ? $periodStart : null,
            'current_period_end' => is_int($periodEnd) ? $periodEnd : null,
            'item_id' => $itemId,
            'price_id' => $priceId,
            'schedule_id' => $this->stringId($subscription->schedule ?? null),
            'cancel_at_period_end' => (bool) ($subscription->cancel_at_period_end ?? false),
        ];
    }

    private function stringId(mixed $value): ?string
    {
        if (is_string($value) && $value !== '') {
            return $value;
        }

        if (is_object($value) && is_string($value->id ?? null)) {
            return $value->id;
        }

        return null;
    }

    /**
     * @return array<string, string>
     */
    private function metadata(mixed $metadata): array
    {
        if (is_object($metadata) && method_exists($metadata, 'toArray')) {
            $metadata = $metadata->toArray();
        }

        if (! is_array($metadata)) {
            return [];
        }

        $mapped = [];

        foreach ($metadata as $key => $value) {
            if (is_string($key) && (is_string($value) || is_numeric($value))) {
                $mapped[$key] = (string) $value;
            }
        }

        return $mapped;
    }
}
