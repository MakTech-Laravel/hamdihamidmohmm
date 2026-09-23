<?php

use App\Enums\EmployerPackage;
use App\Enums\PaymentStatus;
use App\Enums\SubscriptionStatus;
use App\Models\Package;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

beforeEach(function () {
    config()->set([
        'services.yallapay.env' => 'sandbox',
        'services.yallapay.sandbox_url' => 'https://gateway-dev.yallapaysudan.com/api/v1',
        'services.yallapay.production_url' => 'https://gateway.yallapaysudan.com/api/v1',
        'services.yallapay.token' => 'test_sk_example',
        'services.yallapay.webhook_secret' => 'whsec_test_secret',
    ]);
});

test('employers are redirected to yallapay when selecting a paid plan', function () {
    Http::fake([
        'gateway-dev.yallapaysudan.com/*' => Http::response([
            'responseCode' => '0',
            'responseMessage' => 'Success',
            'paymentUrl' => 'https://checkout.yallapay.test/pay/pkg',
        ], 200),
    ]);

    $employer = User::factory()->employer()->create([
        'package' => EmployerPackage::Professional,
    ]);

    $premium = Package::factory()->create([
        'slug' => EmployerPackage::Premium->value,
        'name' => EmployerPackage::Premium->label(),
        'price' => 5000,
        'currency' => 'SDG',
        'job_credits' => 15,
        'featured_credits' => 2,
        'is_public' => true,
        'is_active' => true,
        'is_featured' => true,
    ]);

    $this->actingAs($employer)
        ->post(route('employer.packages.select', $premium))
        ->assertRedirectContains('https://checkout.yallapay.test/pay/pkg');

    $payment = Payment::query()->where('employer_id', $employer->id)->first();

    expect($payment)
        ->not->toBeNull()
        ->status->toBe(PaymentStatus::Pending)
        ->method->toBe('yallapay')
        ->package_id->toBe($premium->id)
        ->amount->toBe(5000);
});

test('inertia package select sends employer to yallapay over xhr', function () {
    Http::fake([
        'gateway-dev.yallapaysudan.com/*' => Http::response([
            'responseCode' => '0',
            'paymentUrl' => 'https://checkout.yallapay.test/pay/pkg',
        ], 200),
    ]);

    $employer = User::factory()->employer()->create([
        'package' => EmployerPackage::Professional,
    ]);

    $premium = Package::factory()->create([
        'slug' => EmployerPackage::Premium->value,
        'price' => 5000,
        'currency' => 'SDG',
        'is_public' => true,
        'is_active' => true,
    ]);

    $response = $this->actingAs($employer)
        ->withHeaders([
            'X-Inertia' => 'true',
            'X-Inertia-Version' => Inertia::getVersion(),
        ])
        ->post(route('employer.packages.select', $premium));

    $response->assertStatus(409);

    expect($response->headers->get('X-Inertia-Location'))
        ->toStartWith('https://checkout.yallapay.test/pay/pkg');
});

test('packages below yallapay minimum cannot start checkout', function () {
    $employer = User::factory()->employer()->create([
        'package' => EmployerPackage::Professional,
    ]);

    $cheap = Package::factory()->create([
        'slug' => EmployerPackage::Premium->value,
        'price' => 999,
        'currency' => 'SDG',
        'is_public' => true,
        'is_active' => true,
    ]);

    $this->actingAs($employer)
        ->from(route('employer.packages'))
        ->post(route('employer.packages.select', $cheap))
        ->assertRedirect(route('employer.packages'))
        ->assertSessionHas('error');
});

test('yallapay checkout success activates the selected package', function () {
    Http::fake([
        'gateway-dev.yallapaysudan.com/api/v1/gateway/getPaymentStatus' => Http::response([
            'responseCode' => '0',
            'status' => 'success',
        ], 200),
    ]);

    $employer = User::factory()->employer()->create([
        'package' => EmployerPackage::Professional,
        'subscription_status' => SubscriptionStatus::Active,
    ]);

    $premium = Package::factory()->create([
        'slug' => EmployerPackage::Premium->value,
        'name' => EmployerPackage::Premium->label(),
        'price' => 5000,
        'currency' => 'SDG',
        'job_credits' => 15,
        'is_public' => true,
        'is_active' => true,
    ]);

    $payment = Payment::factory()->create([
        'employer_id' => $employer->id,
        'package_id' => $premium->id,
        'amount' => 5000,
        'method' => 'yallapay',
        'status' => PaymentStatus::Pending,
        'reference' => 'yp-package-ref-1',
        'paid_at' => null,
    ]);

    $this->actingAs($employer)
        ->get(route('employer.packages.checkout.success', [
            'provider' => 'yallapay',
            'reference' => $payment->reference,
        ]))
        ->assertRedirect(route('employer.packages'))
        ->assertSessionHas('success');

    expect($employer->fresh()->package)->toBe(EmployerPackage::Premium)
        ->and($payment->fresh()->status)->toBe(PaymentStatus::Completed);
});

test('yallapay webhook activates package payment', function () {
    $employer = User::factory()->employer()->create([
        'package' => EmployerPackage::Professional,
    ]);

    $premium = Package::factory()->create([
        'slug' => EmployerPackage::Premium->value,
        'price' => 5000,
        'is_public' => true,
        'is_active' => true,
    ]);

    $payment = Payment::factory()->create([
        'employer_id' => $employer->id,
        'package_id' => $premium->id,
        'amount' => 5000,
        'method' => 'yallapay',
        'status' => PaymentStatus::Pending,
        'reference' => 'yp-hook-pkg',
        'paid_at' => null,
    ]);

    $payload = [
        'clientReferenceId' => 'yp-hook-pkg',
        'status' => 'success',
        'responseCode' => '0',
    ];
    $rawBody = json_encode($payload, JSON_THROW_ON_ERROR);
    $timestamp = now()->timestamp;
    $signature = hash_hmac('sha256', $rawBody, 'whsec_test_secret');

    $this->call(
        'POST',
        route('yallapay.webhook'),
        server: [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_YALLAPAY_SIGNATURE' => $signature,
            'HTTP_YALLAPAY_TIMESTAMP' => (string) $timestamp,
        ],
        content: $rawBody,
    )->assertOk();

    expect($payment->fresh()->status)->toBe(PaymentStatus::Completed)
        ->and($employer->fresh()->package)->toBe(EmployerPackage::Premium);
});
