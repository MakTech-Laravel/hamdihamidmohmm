<?php

use App\Enums\EmployerPackage;
use App\Enums\PaymentStatus;
use App\Enums\SubscriptionStatus;
use App\Models\Package;
use App\Models\Payment;
use App\Models\User;
use App\Services\Stripe\FakeStripeGateway;
use App\Services\Stripe\StripeGateway;
use Inertia\Inertia;

beforeEach(function () {
    FakeStripeGateway::reset();
});

test('employers are redirected to stripe checkout when selecting a paid plan', function () {
    $employer = User::factory()->employer()->create([
        'package' => EmployerPackage::Professional,
    ]);
    $business = Package::factory()->create([
        'slug' => EmployerPackage::Premium->value,
        'name' => EmployerPackage::Premium->label(),
        'price' => 999,
        'currency' => 'SAR',
        'job_credits' => 15,
        'featured_credits' => 2,
        'is_public' => true,
        'is_active' => true,
        'is_featured' => true,
    ]);

    $this->actingAs($employer)
        ->post(route('employer.packages.select', $business))
        ->assertRedirectContains('https://checkout.stripe.test/');

    expect($employer->fresh()->package)->toBe(EmployerPackage::Professional);

    $payment = Payment::query()->where('employer_id', $employer->id)->first();

    expect($payment)
        ->not->toBeNull()
        ->status->toBe(PaymentStatus::Pending)
        ->package_id->toBe($business->id)
        ->method->toBe('stripe')
        ->and($payment?->stripe_checkout_session_id)->toStartWith('cs_test_');
});

test('inertia checkout requests send the employer to stripe instead of following checkout over xhr', function () {
    $employer = User::factory()->employer()->create([
        'package' => EmployerPackage::Professional,
    ]);
    $business = Package::factory()->create([
        'slug' => EmployerPackage::Premium->value,
        'price' => 999,
        'currency' => 'SAR',
        'is_public' => true,
        'is_active' => true,
    ]);

    $response = $this->actingAs($employer)
        ->withHeaders([
            'X-Inertia' => 'true',
            'X-Inertia-Version' => Inertia::getVersion(),
        ])
        ->post(route('employer.packages.select', $business));

    $response->assertStatus(409);

    expect($response->headers->get('X-Inertia-Location'))
        ->toStartWith('https://checkout.stripe.test/');
});

test('stripe checkout success activates the selected subscription', function () {
    $employer = User::factory()->employer()->create([
        'package' => EmployerPackage::Professional,
    ]);
    $business = Package::factory()->create([
        'slug' => EmployerPackage::Premium->value,
        'name' => EmployerPackage::Premium->label(),
        'price' => 999,
        'currency' => 'SAR',
        'job_credits' => 15,
        'is_public' => true,
        'is_active' => true,
    ]);

    $this->actingAs($employer)
        ->post(route('employer.packages.select', $business))
        ->assertRedirect();

    $payment = Payment::query()->where('employer_id', $employer->id)->firstOrFail();

    $this->actingAs($employer)
        ->get(route('employer.packages.checkout.success', [
            'session_id' => $payment->stripe_checkout_session_id,
        ]))
        ->assertRedirect(route('employer.packages'));

    expect($employer->fresh()->package)->toBe(EmployerPackage::Premium)
        ->and($employer->fresh()->subscription_status)->toBe(SubscriptionStatus::Active)
        ->and($employer->fresh()->stripe_customer_id)->toStartWith('cus_test_')
        ->and($employer->fresh()->stripe_subscription_id)->toStartWith('sub_test_')
        ->and($payment->fresh()->status)->toBe(PaymentStatus::Completed)
        ->and($payment->fresh()->invoice_url)->toStartWith('https://invoice.stripe.test/');

    $this->actingAs($employer)
        ->get(route('employer.packages'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/User/EmployerPackages')
            ->where('plan.slug', EmployerPackage::Premium->value)
            ->where('plan.job_credits', 15)
            ->where('plan.subscription_status', SubscriptionStatus::Active->value)
            ->where('billing.enabled', true)
            ->where('billing.can_manage', true)
            ->has('packages')
            ->has('invoices'));
});

test('stripe webhook fulfills a pending checkout session', function () {
    $employer = User::factory()->employer()->create([
        'package' => EmployerPackage::Professional,
    ]);
    $business = Package::factory()->create([
        'slug' => EmployerPackage::Premium->value,
        'price' => 999,
        'currency' => 'SAR',
        'is_public' => true,
        'is_active' => true,
    ]);

    $this->actingAs($employer)
        ->post(route('employer.packages.select', $business))
        ->assertRedirect();

    $payment = Payment::query()->where('employer_id', $employer->id)->firstOrFail();

    $this->postJson(route('stripe.webhook'), [
        'id' => 'evt_test_checkout',
        'object' => 'event',
        'type' => 'checkout.session.completed',
        'data' => [
            'object' => [
                'id' => $payment->stripe_checkout_session_id,
                'status' => 'complete',
                'payment_status' => 'paid',
                'customer' => 'cus_test_webhook',
                'subscription' => 'sub_test_webhook',
                'invoice' => 'in_test_webhook',
                'metadata' => [
                    'payment_id' => (string) $payment->id,
                    'employer_id' => (string) $employer->id,
                    'package_id' => (string) $business->id,
                ],
            ],
        ],
    ], [
        'Stripe-Signature' => 'test',
    ])->assertOk();

    expect($employer->fresh()->package)->toBe(EmployerPackage::Premium)
        ->and($payment->fresh()->status)->toBe(PaymentStatus::Completed);
});

test('complimentary packages activate without stripe checkout', function () {
    $employer = User::factory()->employer()->create([
        'package' => EmployerPackage::Professional,
    ]);
    $starter = Package::factory()->create([
        'slug' => EmployerPackage::Starter->value,
        'name' => EmployerPackage::Starter->label(),
        'price' => 0,
        'currency' => 'SAR',
        'is_public' => true,
        'is_active' => true,
    ]);

    $this->actingAs($employer)
        ->from(route('employer.packages'))
        ->post(route('employer.packages.select', $starter))
        ->assertRedirect(route('employer.packages'));

    expect($employer->fresh()->package)->toBe(EmployerPackage::Starter)
        ->and(Payment::query()->where('employer_id', $employer->id)->first())
        ->status->toBe(PaymentStatus::Completed)
        ->method->toBe('complimentary');
});

test('employers with an active stripe subscription upgrade immediately without a second checkout', function () {
    $employer = User::factory()->employer()->create([
        'package' => EmployerPackage::Professional,
    ]);
    $professional = Package::factory()->create([
        'slug' => EmployerPackage::Professional->value,
        'price' => 299,
        'currency' => 'SAR',
        'is_public' => true,
        'is_active' => true,
    ]);
    $premium = Package::factory()->create([
        'slug' => EmployerPackage::Premium->value,
        'price' => 999,
        'currency' => 'SAR',
        'is_public' => true,
        'is_active' => true,
    ]);

    $this->actingAs($employer)
        ->post(route('employer.packages.select', $professional))
        ->assertRedirect();

    $this->actingAs($employer)
        ->get(route('employer.packages.checkout.success', [
            'session_id' => Payment::query()->where('employer_id', $employer->id)->value('stripe_checkout_session_id'),
        ]))
        ->assertRedirect(route('employer.packages'));

    $this->actingAs($employer)
        ->from(route('employer.packages'))
        ->post(route('employer.packages.select', $premium))
        ->assertRedirect(route('employer.packages'));

    expect($employer->fresh()->package)->toBe(EmployerPackage::Premium)
        ->and(Payment::query()->where('employer_id', $employer->id)->count())->toBe(2);
});

test('billing cards label the current plan and upgrade or downgrade actions', function () {
    $employer = User::factory()->employer()->create([
        'package' => EmployerPackage::Professional,
    ]);
    $professional = Package::factory()->create([
        'slug' => EmployerPackage::Professional->value,
        'name' => EmployerPackage::Professional->label(),
        'price' => 299,
        'currency' => 'SAR',
        'sort_order' => 1,
        'is_public' => true,
        'is_active' => true,
    ]);
    $premium = Package::factory()->create([
        'slug' => EmployerPackage::Premium->value,
        'name' => EmployerPackage::Premium->label(),
        'price' => 999,
        'currency' => 'SAR',
        'sort_order' => 2,
        'is_public' => true,
        'is_active' => true,
    ]);
    Package::factory()->create([
        'slug' => EmployerPackage::Enterprise->value,
        'name' => EmployerPackage::Enterprise->label(),
        'price' => 1199,
        'currency' => 'SAR',
        'sort_order' => 3,
        'is_public' => true,
        'is_active' => true,
    ]);

    $this->actingAs($employer)
        ->post(route('employer.packages.select', $premium))
        ->assertRedirect();

    $this->actingAs($employer)
        ->get(route('employer.packages.checkout.success', [
            'session_id' => Payment::query()->where('employer_id', $employer->id)->value('stripe_checkout_session_id'),
        ]))
        ->assertRedirect();

    $this->actingAs($employer)
        ->get(route('employer.packages'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/User/EmployerPackages')
            ->where('plan.slug', EmployerPackage::Premium->value)
            ->where('plan.pending_change', null)
            ->has('packages', 3)
            ->where('packages.0.id', $professional->id)
            ->where('packages.0.action', 'downgrade')
            ->where('packages.0.current', false)
            ->where('packages.1.id', $premium->id)
            ->where('packages.1.action', 'current')
            ->where('packages.1.current', true)
            ->where('packages.2.action', 'upgrade')
            ->where('packages.2.current', false));
});

test('downgrades keep the current plan until the billing period ends', function () {
    $employer = User::factory()->employer()->create([
        'package' => EmployerPackage::Professional,
    ]);
    $professional = Package::factory()->create([
        'slug' => EmployerPackage::Professional->value,
        'name' => EmployerPackage::Professional->label(),
        'price' => 299,
        'currency' => 'SAR',
        'sort_order' => 1,
        'is_public' => true,
        'is_active' => true,
    ]);
    $premium = Package::factory()->create([
        'slug' => EmployerPackage::Premium->value,
        'name' => EmployerPackage::Premium->label(),
        'price' => 999,
        'currency' => 'SAR',
        'sort_order' => 2,
        'is_public' => true,
        'is_active' => true,
    ]);

    $this->actingAs($employer)
        ->post(route('employer.packages.select', $premium))
        ->assertRedirect();

    $this->actingAs($employer)
        ->get(route('employer.packages.checkout.success', [
            'session_id' => Payment::query()->where('employer_id', $employer->id)->value('stripe_checkout_session_id'),
        ]))
        ->assertRedirect();

    $this->actingAs($employer)
        ->from(route('employer.packages'))
        ->post(route('employer.packages.select', $professional))
        ->assertRedirect(route('employer.packages'))
        ->assertSessionHas('success');

    $employer = $employer->fresh();

    expect($employer?->package)->toBe(EmployerPackage::Premium)
        ->and($employer?->pending_package)->toBe(EmployerPackage::Professional)
        ->and($employer?->pending_package_at)->not->toBeNull()
        ->and(Payment::query()->where('employer_id', $employer?->id)->count())->toBe(1);

    $this->actingAs($employer)
        ->get(route('employer.packages'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('plan.slug', EmployerPackage::Premium->value)
            ->where('plan.pending_change.slug', EmployerPackage::Professional->value)
            ->where('packages.0.scheduled', true));
});

test('a scheduled downgrade becomes the active plan when stripe renews the subscription', function () {
    $employer = User::factory()->employer()->create([
        'package' => EmployerPackage::Professional,
    ]);
    $professional = Package::factory()->create([
        'slug' => EmployerPackage::Professional->value,
        'price' => 299,
        'currency' => 'SAR',
        'is_public' => true,
        'is_active' => true,
    ]);
    $premium = Package::factory()->create([
        'slug' => EmployerPackage::Premium->value,
        'price' => 999,
        'currency' => 'SAR',
        'is_public' => true,
        'is_active' => true,
    ]);

    $this->actingAs($employer)
        ->post(route('employer.packages.select', $premium))
        ->assertRedirect();

    $this->actingAs($employer)
        ->get(route('employer.packages.checkout.success', [
            'session_id' => Payment::query()->where('employer_id', $employer->id)->value('stripe_checkout_session_id'),
        ]))
        ->assertRedirect();

    $this->actingAs($employer)
        ->post(route('employer.packages.select', $professional))
        ->assertRedirect();

    $employer = $employer->fresh();
    $professional->refresh();

    $this->postJson(route('stripe.webhook'), [
        'id' => 'evt_test_downgrade',
        'object' => 'event',
        'type' => 'customer.subscription.updated',
        'data' => [
            'object' => [
                'id' => $employer?->stripe_subscription_id,
                'status' => 'active',
                'customer' => $employer?->stripe_customer_id,
                'current_period_end' => now()->addMonth()->timestamp,
                'items' => [
                    'data' => [
                        [
                            'id' => 'si_test_downgrade',
                            'price' => $professional->stripe_price_id,
                            'current_period_end' => now()->addMonth()->timestamp,
                        ],
                    ],
                ],
            ],
        ],
    ], [
        'Stripe-Signature' => 'test',
    ])->assertOk();

    expect($employer?->fresh()->package)->toBe(EmployerPackage::Professional)
        ->and($employer?->fresh()->pending_package)->toBeNull();
});

test('upgrading cancels a scheduled downgrade and switches immediately', function () {
    $employer = User::factory()->employer()->create([
        'package' => EmployerPackage::Professional,
    ]);
    $professional = Package::factory()->create([
        'slug' => EmployerPackage::Professional->value,
        'price' => 299,
        'currency' => 'SAR',
        'is_public' => true,
        'is_active' => true,
    ]);
    $premium = Package::factory()->create([
        'slug' => EmployerPackage::Premium->value,
        'price' => 999,
        'currency' => 'SAR',
        'is_public' => true,
        'is_active' => true,
    ]);
    $enterprise = Package::factory()->create([
        'slug' => EmployerPackage::Enterprise->value,
        'price' => 1199,
        'currency' => 'SAR',
        'is_public' => true,
        'is_active' => true,
    ]);

    $this->actingAs($employer)
        ->post(route('employer.packages.select', $premium))
        ->assertRedirect();

    $this->actingAs($employer)
        ->get(route('employer.packages.checkout.success', [
            'session_id' => Payment::query()->where('employer_id', $employer->id)->value('stripe_checkout_session_id'),
        ]))
        ->assertRedirect();

    $this->actingAs($employer)
        ->post(route('employer.packages.select', $professional))
        ->assertRedirect();

    $this->actingAs($employer)
        ->from(route('employer.packages'))
        ->post(route('employer.packages.select', $enterprise))
        ->assertRedirect(route('employer.packages'));

    $employer = $employer->fresh();

    expect($employer?->package)->toBe(EmployerPackage::Enterprise)
        ->and($employer?->pending_package)->toBeNull()
        ->and($employer?->stripe_schedule_id)->toBeNull();
});

test('employers can open the stripe billing portal after checkout', function () {
    $employer = User::factory()->employer()->create([
        'package' => EmployerPackage::Professional,
    ]);
    $professional = Package::factory()->create([
        'slug' => EmployerPackage::Professional->value,
        'price' => 299,
        'currency' => 'SAR',
        'is_public' => true,
        'is_active' => true,
    ]);

    $this->actingAs($employer)
        ->post(route('employer.packages.select', $professional))
        ->assertRedirect();

    $this->actingAs($employer)
        ->get(route('employer.packages.checkout.success', [
            'session_id' => Payment::query()->where('employer_id', $employer->id)->value('stripe_checkout_session_id'),
        ]))
        ->assertRedirect();

    $this->actingAs($employer)
        ->post(route('employer.packages.portal'))
        ->assertRedirectContains('https://billing.stripe.test/');
});

test('invoice paid webhooks record renewals without duplicating the first checkout payment', function () {
    $employer = User::factory()->employer()->create([
        'package' => EmployerPackage::Professional,
    ]);
    $professional = Package::factory()->create([
        'slug' => EmployerPackage::Professional->value,
        'price' => 299,
        'currency' => 'SAR',
        'is_public' => true,
        'is_active' => true,
    ]);

    $this->actingAs($employer)
        ->post(route('employer.packages.select', $professional))
        ->assertRedirect();

    $payment = Payment::query()->where('employer_id', $employer->id)->firstOrFail();

    $this->actingAs($employer)
        ->get(route('employer.packages.checkout.success', [
            'session_id' => $payment->stripe_checkout_session_id,
        ]))
        ->assertRedirect();

    $employer = $employer->fresh();
    $payment = $payment->fresh();

    $this->postJson(route('stripe.webhook'), [
        'id' => 'evt_test_first_invoice',
        'object' => 'event',
        'type' => 'invoice.paid',
        'data' => [
            'object' => [
                'id' => 'in_test_first',
                'billing_reason' => 'subscription_create',
                'amount_paid' => 29900,
                'currency' => 'sar',
                'hosted_invoice_url' => 'https://invoice.stripe.test/in_test_first',
                'customer' => $employer?->stripe_customer_id,
                'subscription' => $employer?->stripe_subscription_id,
            ],
        ],
    ], [
        'Stripe-Signature' => 'test',
    ])->assertOk();

    expect(Payment::query()->where('employer_id', $employer?->id)->count())->toBe(1)
        ->and($payment->fresh()?->invoice_url)->toBe('https://invoice.stripe.test/in_test_first');

    $this->postJson(route('stripe.webhook'), [
        'id' => 'evt_test_renewal',
        'object' => 'event',
        'type' => 'invoice.paid',
        'data' => [
            'object' => [
                'id' => 'in_test_renewal',
                'billing_reason' => 'subscription_cycle',
                'amount_paid' => 29900,
                'currency' => 'sar',
                'number' => 'INV-2026-REN',
                'hosted_invoice_url' => 'https://invoice.stripe.test/in_test_renewal',
                'customer' => $employer?->stripe_customer_id,
                'subscription' => $employer?->stripe_subscription_id,
            ],
        ],
    ], [
        'Stripe-Signature' => 'test',
    ])->assertOk();

    expect(Payment::query()->where('employer_id', $employer?->id)->count())->toBe(2)
        ->and(Payment::query()->where('stripe_invoice_id', 'in_test_renewal')->first())
        ->status->toBe(PaymentStatus::Completed)
        ->amount->toBe(299);
});

test('stripe connection failures return to billing with an error instead of crashing', function () {
    $this->mock(StripeGateway::class, function ($mock) {
        $mock->shouldReceive('enabled')->andReturn(true);
        $mock->shouldReceive('createProduct')->andThrow(
            new RuntimeException('Could not reach Stripe. Check your internet connection, firewall, or VPN, then try again.')
        );
    });

    $employer = User::factory()->employer()->create([
        'package' => EmployerPackage::Professional,
    ]);
    $premium = Package::factory()->create([
        'slug' => EmployerPackage::Premium->value,
        'price' => 999,
        'currency' => 'SAR',
        'is_public' => true,
        'is_active' => true,
    ]);

    $this->actingAs($employer)
        ->from(route('employer.packages'))
        ->post(route('employer.packages.select', $premium))
        ->assertRedirect(route('employer.packages'))
        ->assertSessionHas('error', 'Could not reach Stripe. Check your internet connection, firewall, or VPN, then try again.');
});
