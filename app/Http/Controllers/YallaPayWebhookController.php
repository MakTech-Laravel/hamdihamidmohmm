<?php

namespace App\Http\Controllers;

use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Services\YallaPay\YallaPayPackageCheckoutService;
use App\Services\YallaPay\YallaPayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class YallaPayWebhookController extends Controller
{
    public function __invoke(
        Request $request,
        YallaPayService $yallaPay,
        YallaPayPackageCheckoutService $checkout,
    ): JsonResponse {
        $rawBody = $request->getContent();
        $signature = (string) $request->header('YallaPay-Signature', '');
        $timestamp = (string) $request->header('YallaPay-TimeStamp', '');

        if ($signature === '' || $timestamp === '' || ! $yallaPay->verifyWebhookSignature($rawBody, $signature, $timestamp)) {
            Log::warning('YallaPay webhook: invalid signature or timestamp');

            return response()->json(['message' => 'invalid signature'], Response::HTTP_UNAUTHORIZED);
        }

        /** @var array<string, mixed> $data */
        $data = $request->json()->all();

        Log::info('YallaPay webhook received', $data);

        $reference = is_string($data['clientReferenceId'] ?? null) ? $data['clientReferenceId'] : null;
        $status = strtolower((string) ($data['status'] ?? $data['paymentStatus'] ?? ''));

        if ($reference !== null) {
            $payment = Payment::query()->where('reference', $reference)->where('method', 'yallapay')->first();

            if ($payment instanceof Payment) {
                $isSuccessful = in_array($status, ['success', 'successful', 'paid', 'completed'], true)
                    || ($data['responseCode'] ?? null) === '0';

                $isFailed = in_array($status, ['failed', 'cancelled', 'canceled', 'declined'], true);

                if ($isSuccessful) {
                    $checkout->fulfillPayment($payment);
                } elseif ($isFailed && $payment->status === PaymentStatus::Pending) {
                    $checkout->markFailed($payment);
                }
            }
        }

        return response()->json(['message' => 'ok'], Response::HTTP_OK);
    }
}
