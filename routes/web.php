<?php

use App\Http\Controllers\StripeWebhookController;
use Illuminate\Support\Facades\Route;

require __DIR__.'/settings.php';
require __DIR__.'/frontend.php';
require __DIR__.'/user.php';
require __DIR__.'/admin.php';

Route::post('/stripe/webhook', StripeWebhookController::class)->name('stripe.webhook');
