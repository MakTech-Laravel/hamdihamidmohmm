<?php

use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Models\User;
use App\Services\YallaPay\YallaPayService;

beforeEach(function () {
    config()->set([
        'services.yallapay.webhook_secret' => 'whsec_test_secret',
        'services.yallapay.token' => 'test_sk_example',
        'services.yallapay.env' => 'sandbox',
        'services.yallapay.sandbox_url' => 'https://gateway-dev.yallapaysudan.com/api/v1',
    ]);
});

function yallaPayWebhookHeaders(string $rawBody, string $secret = 'whsec_test_secret', ?int $timestamp = null): array
{
    $timestamp ??= now()->timestamp;
    $signature = hash_hmac('sha256', $rawBody, $secret);

    return [
        'CONTENT_TYPE' => 'application/json',
        'HTTP_YALLAPAY_SIGNATURE' => $signature,
        'HTTP_YALLAPAY_TIMESTAMP' => (string) $timestamp,
    ];
}

test('webhook rejects invalid signatures', function () {
    $payload = ['clientReferenceId' => 'ref-1', 'status' => 'success'];
    $rawBody = json_encode($payload, JSON_THROW_ON_ERROR);

    $this->call(
        'POST',
        route('yallapay.webhook'),
        server: yallaPayWebhookHeaders($rawBody, 'wrong-secret'),
        content: $rawBody,
    )->assertUnauthorized();
});

test('webhook rejects stale timestamps', function () {
    $payload = ['clientReferenceId' => 'ref-1', 'status' => 'success'];
    $rawBody = json_encode($payload, JSON_THROW_ON_ERROR);
    $stale = now()->subMinutes(10)->timestamp;

    $this->call(
        'POST',
        route('yallapay.webhook'),
        server: yallaPayWebhookHeaders($rawBody, 'whsec_test_secret', $stale),
        content: $rawBody,
    )->assertUnauthorized();
});

test('webhook marks matching pending payment as completed', function () {
    $employer = User::factory()->employer()->create();
    $payment = Payment::factory()->create([
        'employer_id' => $employer->id,
        'package_id' => null,
        'amount' => 5000,
        'method' => 'yallapay',
        'status' => PaymentStatus::Pending,
        'reference' => 'yp-ref-123',
        'paid_at' => null,
    ]);

    $payload = [
        'clientReferenceId' => 'yp-ref-123',
        'status' => 'success',
        'responseCode' => '0',
    ];
    $rawBody = json_encode($payload, JSON_THROW_ON_ERROR);

    $this->call(
        'POST',
        route('yallapay.webhook'),
        server: yallaPayWebhookHeaders($rawBody),
        content: $rawBody,
    )->assertOk()
        ->assertJson(['message' => 'ok']);

    $payment->refresh();

    expect($payment->status)->toBe(PaymentStatus::Completed)
        ->and($payment->paid_at)->not->toBeNull();
});

test('webhook marks matching pending payment as failed', function () {
    $employer = User::factory()->employer()->create();
    $payment = Payment::factory()->create([
        'employer_id' => $employer->id,
        'package_id' => null,
        'method' => 'yallapay',
        'status' => PaymentStatus::Pending,
        'reference' => 'yp-ref-fail',
        'paid_at' => null,
    ]);

    $payload = [
        'clientReferenceId' => 'yp-ref-fail',
        'status' => 'failed',
    ];
    $rawBody = json_encode($payload, JSON_THROW_ON_ERROR);

    $this->call(
        'POST',
        route('yallapay.webhook'),
        server: yallaPayWebhookHeaders($rawBody),
        content: $rawBody,
    )->assertOk();

    expect($payment->fresh()->status)->toBe(PaymentStatus::Failed);
});

test('service verifies webhook signatures correctly', function () {
    $service = app(YallaPayService::class);
    $rawBody = '{"ok":true}';
    $timestamp = (string) now()->timestamp;
    $signature = hash_hmac('sha256', $rawBody, 'whsec_test_secret');

    expect($service->verifyWebhookSignature($rawBody, $signature, $timestamp))->toBeTrue()
        ->and($service->verifyWebhookSignature($rawBody, 'bad', $timestamp))->toBeFalse();
});
