<?php

namespace App\Http\Controllers;

use App\Services\Stripe\StripeWebhookProcessor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;
use Symfony\Component\HttpFoundation\Response;

class StripeWebhookController extends Controller
{
    public function __invoke(Request $request, StripeWebhookProcessor $processor): JsonResponse
    {
        try {
            $processor->handle(
                $request->getContent(),
                (string) $request->header('Stripe-Signature', ''),
            );
        } catch (RuntimeException $exception) {
            return response()->json([
                'error' => $exception->getMessage(),
            ], Response::HTTP_BAD_REQUEST);
        }

        return response()->json(['received' => true]);
    }
}
