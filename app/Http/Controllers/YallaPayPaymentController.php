<?php

namespace App\Http\Controllers;

use App\Enums\PaymentStatus;
use App\Http\Requests\YallaPayCheckoutRequest;
use App\Models\Payment;
use App\Services\YallaPay\YallaPayService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class YallaPayPaymentController extends Controller
{
    public function show(): InertiaResponse
    {
        return Inertia::render('frontend/yallapay-checkout', [
            'minAmount' => 1000,
            'defaultAmount' => 5000,
        ]);
    }

    public function pay(YallaPayCheckoutRequest $request, YallaPayService $yallaPay): RedirectResponse|SymfonyResponse
    {
        $reference = (string) Str::uuid();
        $amount = (int) $request->integer('amount');
        $description = (string) ($request->string('description')->toString() ?: 'YallaPay checkout');

        $user = $request->user();

        if ($user !== null && $user->isEmployer()) {
            Payment::query()->create([
                'employer_id' => $user->id,
                'package_id' => null,
                'amount' => $amount,
                'currency' => 'SDG',
                'method' => 'yallapay',
                'status' => PaymentStatus::Pending,
                'reference' => $reference,
            ]);
        }

        try {
            $result = $yallaPay->createPayment([
                'amount' => $amount,
                'reference' => $reference,
                'description' => $description,
                'success_url' => route('yallapay.success', absolute: true),
                'failed_url' => route('yallapay.failed', absolute: true),
            ]);
        } catch (\RuntimeException $exception) {
            Log::warning('YallaPay payment link creation failed', [
                'reference' => $reference,
                'message' => $exception->getMessage(),
            ]);

            return back()->withErrors([
                'payment' => $exception->getMessage(),
            ]);
        }

        if ($yallaPay->isSuccessfulResponse($result)) {
            return Inertia::location((string) $result['paymentUrl']);
        }

        return back()->withErrors([
            'payment' => (string) ($result['responseMessage'] ?? 'Payment failed to initiate'),
        ]);
    }

    public function success(): InertiaResponse
    {
        return Inertia::render('frontend/yallapay-result', [
            'status' => 'success',
            'title' => 'Payment successful',
            'message' => 'Your payment was received. Final confirmation is completed via webhook.',
        ]);
    }

    public function failed(): InertiaResponse
    {
        return Inertia::render('frontend/yallapay-result', [
            'status' => 'failed',
            'title' => 'Payment failed',
            'message' => 'Payment failed or was cancelled. You can try again.',
        ]);
    }
}
