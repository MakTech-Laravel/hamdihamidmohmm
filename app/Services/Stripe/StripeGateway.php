<?php

namespace App\Services\Stripe;

interface StripeGateway
{
    public function enabled(): bool;

    /**
     * @param  array<string, mixed>  $params
     * @return array{id: string}
     */
    public function createCustomer(array $params): array;

    /**
     * @param  array<string, mixed>  $params
     * @return array{id: string}
     */
    public function createProduct(array $params): array;

    /**
     * @param  array<string, mixed>  $params
     * @return array{id: string}
     */
    public function updateProduct(string $id, array $params): array;

    /**
     * @param  array<string, mixed>  $params
     * @return array{id: string}
     */
    public function createPrice(array $params): array;

    /**
     * @param  array<string, mixed>  $params
     * @return array{id: string, url: string}
     */
    public function createCheckoutSession(array $params): array;

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
    public function retrieveCheckoutSession(string $id): array;

    /**
     * @param  array<string, mixed>  $params
     * @return array{id: string, url: string}
     */
    public function createBillingPortalSession(array $params): array;

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
    public function retrieveSubscription(string $id): array;

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
    public function updateSubscription(string $id, array $params): array;

    /**
     * @return array{
     *     id: string,
     *     subscription: string|null,
     *     current_period_start: int|null,
     *     current_period_end: int|null,
     *     price_id: string|null
     * }
     */
    public function createSubscriptionScheduleFromSubscription(string $subscriptionId): array;

    /**
     * @param  array<string, mixed>  $params
     * @return array{id: string, subscription: string|null}
     */
    public function updateSubscriptionSchedule(string $id, array $params): array;

    /**
     * @return array{id: string}
     */
    public function releaseSubscriptionSchedule(string $id): array;

    /**
     * @return array{id: string, type: string, data: array{object: array<string, mixed>}}
     */
    public function constructEvent(string $payload, string $signature): array;
}
