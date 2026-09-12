<?php

use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config()->set([
        'services.yallapay.env' => 'sandbox',
        'services.yallapay.sandbox_url' => 'https://gateway-dev.yallapaysudan.com/api/v1',
        'services.yallapay.production_url' => 'https://gateway.yallapaysudan.com/api/v1',
        'services.yallapay.token' => 'test_sk_example',
        'services.yallapay.webhook_secret' => 'whsec_test_secret',
    ]);
});

test('checkout page renders', function () {
    $this->get(route('yallapay.checkout'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('frontend/yallapay-checkout')
            ->where('minAmount', 1000)
            ->where('defaultAmount', 5000));
});

test('pay redirects to yallapay payment url when link is created', function () {
    Http::fake([
        'gateway-dev.yallapaysudan.com/*' => Http::response([
            'responseCode' => 0,
            'responseMessage' => 'Success',
            'paymentUrl' => 'https://checkout.yallapay.test/pay/abc',
        ], 200),
    ]);

    $response = $this->post(route('yallapay.pay'), [
        'amount' => 5000,
        'description' => 'Test order',
    ]);

    $response->assertRedirect('https://checkout.yallapay.test/pay/abc');

    Http::assertSent(function ($request) {
        return $request->url() === 'https://gateway-dev.yallapaysudan.com/api/v1/gateway/generatePaymentLink'
            && $request['amount'] === 5000
            && $request['description'] === 'Test order'
            && filled($request['clientReferenceId']);
    });
});

test('pay validates minimum amount', function () {
    $this->from(route('yallapay.checkout'))
        ->post(route('yallapay.pay'), [
            'amount' => 500,
        ])
        ->assertRedirect(route('yallapay.checkout'))
        ->assertSessionHasErrors('amount');
});

test('authenticated employer gets a pending yallapay payment record', function () {
    Http::fake([
        'gateway-dev.yallapaysudan.com/*' => Http::response([
            'responseCode' => '0',
            'paymentUrl' => 'https://checkout.yallapay.test/pay/abc',
        ], 200),
    ]);

    $employer = User::factory()->employer()->create();

    $this->actingAs($employer)
        ->post(route('yallapay.pay'), [
            'amount' => 2500,
        ])
        ->assertRedirect();

    $payment = Payment::query()->where('employer_id', $employer->id)->first();

    expect($payment)
        ->not->toBeNull()
        ->method->toBe('yallapay')
        ->status->toBe(PaymentStatus::Pending)
        ->amount->toBe(2500)
        ->and($payment?->reference)->not->toBeEmpty();
});

test('pay returns error when yallapay rejects the request', function () {
    Http::fake([
        'gateway-dev.yallapaysudan.com/*' => Http::response([
            'responseCode' => '1',
            'responseMessage' => 'Invalid amount',
        ], 200),
    ]);

    $this->from(route('yallapay.checkout'))
        ->post(route('yallapay.pay'), [
            'amount' => 5000,
        ])
        ->assertRedirect(route('yallapay.checkout'))
        ->assertSessionHasErrors('payment');
});

test('success and failed pages render', function () {
    $this->get(route('yallapay.success'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('frontend/yallapay-result')
            ->where('status', 'success'));

    $this->get(route('yallapay.failed'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('frontend/yallapay-result')
            ->where('status', 'failed'));
});
