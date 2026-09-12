<?php

use App\Http\Controllers\StripeWebhookController;
use App\Http\Controllers\YallaPayPaymentController;
use App\Http\Controllers\YallaPayWebhookController;
use Illuminate\Support\Facades\Route;

require __DIR__.'/settings.php';
require __DIR__.'/frontend.php';
require __DIR__.'/user.php';
require __DIR__.'/admin.php';

Route::post('/stripe/webhook', StripeWebhookController::class)->name('stripe.webhook');

Route::get('/checkout/yallapay', [YallaPayPaymentController::class, 'show'])->name('yallapay.checkout');
Route::post('/checkout/yallapay', [YallaPayPaymentController::class, 'pay'])->name('yallapay.pay');
Route::get('/payment/yallapay/success', [YallaPayPaymentController::class, 'success'])->name('yallapay.success');
Route::get('/payment/yallapay/failed', [YallaPayPaymentController::class, 'failed'])->name('yallapay.failed');
Route::post('/api/webhooks/yallapay', YallaPayWebhookController::class)->name('yallapay.webhook');
