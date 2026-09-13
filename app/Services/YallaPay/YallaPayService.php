<?php

namespace App\Services\YallaPay;

use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;

class YallaPayService
{
    protected string $baseUrl;

    protected string $token;

    public function __construct()
    {
        /** @var array{env?: string, sandbox_url?: string|null, production_url?: string|null, token?: string|null} $config */
        $config = config('services.yallapay', []);

        $this->baseUrl = ($config['env'] ?? 'sandbox') === 'production'
            ? (string) ($config['production_url'] ?? '')
            : (string) ($config['sandbox_url'] ?? '');

        $this->token = (string) ($config['token'] ?? '');
    }

    public function enabled(): bool
    {
        if (! filter_var(config('services.yallapay.enabled', true), FILTER_VALIDATE_BOOLEAN)) {
            return false;
        }

        return $this->token !== '' && $this->baseUrl !== '';
    }

    /**
     * Create a one-time payment checkout link.
     *
     * @param  array{amount: int|float|string, reference: string, description: string, success_url: string, failed_url: string}  $data
     * @return array<string, mixed>
     *
     * @throws RequestException
     */
    public function createPayment(array $data): array
    {
        $response = Http::withToken($this->token)
            ->acceptJson()
            ->asJson()
            ->post("{$this->baseUrl}/gateway/generatePaymentLink", [
                'amount' => $data['amount'],
                'clientReferenceId' => $data['reference'],
                'description' => $data['description'],
                'paymentSuccessfulRedirectUrl' => $data['success_url'],
                'paymentFailedRedirectUrl' => $data['failed_url'],
            ]);

        $response->throw();

        /** @var array<string, mixed> */
        return $response->json() ?? [];
    }

    /**
     * Check payment status by client reference id and transaction date (YYYY-MM-DD).
     *
     * @return array<string, mixed>
     *
     * @throws RequestException
     */
    public function getPaymentStatus(string $clientReferenceId, string $transactionDate): array
    {
        $response = Http::withToken($this->token)
            ->acceptJson()
            ->asJson()
            ->post("{$this->baseUrl}/gateway/getPaymentStatus", [
                'clientReferenceId' => $clientReferenceId,
                'transactionDate' => $transactionDate,
            ]);

        $response->throw();

        /** @var array<string, mixed> */
        return $response->json() ?? [];
    }

    /**
     * Verify webhook signature per YallaPay docs:
     * YallaPay-Signature = HMAC-SHA-256(SecretKey, RawJsonBodyBytes)
     *
     * @see https://yallapaysudan.com/en/docs/redirects-and-webhooks
     */
    public function verifyWebhookSignature(string $rawBody, string $signature, string $timestamp): bool
    {
        $secret = (string) config('services.yallapay.webhook_secret', '');

        if ($secret === '' || $signature === '') {
            return false;
        }

        $eventTime = (int) $timestamp;

        // Docs may send milliseconds; normalize to seconds for replay checks.
        if ($eventTime > 9_999_999_999) {
            $eventTime = (int) floor($eventTime / 1000);
        }

        if (abs(now()->timestamp - $eventTime) > 300) {
            return false;
        }

        $expected = hash_hmac('sha256', $rawBody, $secret);

        return hash_equals($expected, $signature);
    }
}
