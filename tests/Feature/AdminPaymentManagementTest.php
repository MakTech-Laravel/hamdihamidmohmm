<?php

use App\Enums\PaymentStatus;
use App\Models\Package;
use App\Models\Payment;
use App\Models\User;

test('admin payment index exposes SDG as the default currency', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.payments.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/Admin/PaymentsRevenue')
            ->where('currency', 'SDG'));
});

test('admin can record a payment with default SDG currency', function () {
    $admin = User::factory()->admin()->create();
    $employer = User::factory()->employer()->create();
    $package = Package::factory()->create(['slug' => 'professional', 'price' => 299]);

    $this->actingAs($admin)
        ->post(route('admin.payments.store'), [
            'employer_id' => $employer->id,
            'package_id' => $package->id,
            'amount' => 299,
            'method' => 'bank_transfer',
            'status' => PaymentStatus::Completed->value,
        ])
        ->assertRedirect();

    expect(Payment::query()->first()?->currency)->toBe('SDG');
});

test('admin can record a payment with an explicit currency', function () {
    $admin = User::factory()->admin()->create();
    $employer = User::factory()->employer()->create();

    $this->actingAs($admin)
        ->post(route('admin.payments.store'), [
            'employer_id' => $employer->id,
            'amount' => 150,
            'currency' => 'SDG',
            'method' => 'bank_transfer',
            'status' => PaymentStatus::Pending->value,
        ])
        ->assertRedirect();

    expect(Payment::query()->first()?->currency)->toBe('SDG');
});
