<?php

namespace App\Services\YallaPay;

use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class YallaPayService
{
    protected string $baseUrl;

    protected string $token;

    public function __construct()
    {
        /** @var array{env?: string, sandbox_url?: string|null, production_url?: string|null, token?: string|null} $config */
        $config = config('services.yallapay', []);

        $this->baseUrl = rtrim(
            ($config['env'] ?? 'sandbox') === 'production'
                ? (string) ($config['production_url'] ?? '')
                : (string) ($config['sandbox_url'] ?? ''),
            '/',
        );

        // Strip quotes/whitespace that often sneak in from .env or panel pastes.
        $this->token = trim((string) ($config['token'] ?? ''), " \t\n\r\0\x0B\"'");
    }

    public function enabled(): bool
    {
        if (! filter_var(config('services.yallapay.enabled', true), FILTER_VALIDATE_BOOLEAN)) {
            return false;
        }

        return $this->token !== '' && $this->baseUrl !== '';
    }

    /**
     * @param  array<string, mixed>  $result
     */
    public function isSuccessfulResponse(array $result): bool
    {
        return (string) ($result['responseCode'] ?? '') === '0'
            && filled($result['paymentUrl'] ?? null);
    }

    /**
     * Create a one-time payment checkout link.
     *
     * @param  array{amount: int|float|string, reference: string, description: string, success_url: string, failed_url: string}  $data
     * @return array<string, mixed>
     */
    public function createPayment(array $data): array
    {
        $response = Http::withToken($this->token)
            ->acceptJson()
            ->asJson()
            ->post("{$this->baseUrl}/gateway/generatePaymentLink", [
                'amount' => (int) $data['amount'],
                'clientReferenceId' => $data['reference'],
                'description' => $data['description'],
                'paymentSuccessfulRedirectUrl' => $data['success_url'],
                'paymentFailedRedirectUrl' => $data['failed_url'],
            ]);

        /** @var array<string, mixed> $json */
        $json = $response->json() ?? [];

        if ($response->failed()) {
            Log::warning('YallaPay generatePaymentLink HTTP error', [
                'status' => $response->status(),
                'body' => $json,
                'reference' => $data['reference'],
                'base_url' => $this->baseUrl,
                'token_prefix' => $this->token !== '' ? substr($this->token, 0, 8) . '…' : '(empty)',
            ]);

            $message = is_string($json['responseMessage'] ?? null)
                ? $json['responseMessage']
                : 'YallaPay could not create a payment link (HTTP ' . $response->status() . ').';

            if ($response->status() === 401 || strcasecmp($message, 'Invalid credentials') === 0) {
                $message = 'YallaPay rejected the API token (Invalid credentials). '
                    . 'Copy the Test Mode token from Dashboard → Developers → API Credentials '
                    . 'into the server .env as YALLAPAY_AUTH_TOKEN, then run php artisan config:clear.';
            }

            throw new RuntimeException($message);
        }

        return $json;
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
