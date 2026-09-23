<?php

use App\Enums\EmployerPackage;
use App\Enums\PaymentStatus;
use App\Enums\SubscriptionStatus;
use App\Models\Package;
use App\Models\Payment;
use App\Models\User;

test('complimentary packages activate without online checkout', function () {
    $employer = User::factory()->employer()->create([
        'package' => null,
        'subscription_status' => null,
    ]);

    $free = Package::factory()->create([
        'slug' => EmployerPackage::Professional->value,
        'name' => EmployerPackage::Professional->label(),
        'price' => 0,
        'currency' => 'SDG',
        'is_public' => true,
        'is_active' => true,
    ]);

    $this->actingAs($employer)
        ->from(route('employer.packages'))
        ->post(route('employer.packages.select', $free))
        ->assertRedirect(route('employer.packages'))
        ->assertSessionHas('success');

    $employer->refresh();

    expect($employer->package)->toBe(EmployerPackage::Professional)
        ->and($employer->subscription_status)->toBe(SubscriptionStatus::Active)
        ->and($employer->subscription_ends_at)->not->toBeNull();

    expect(Payment::query()->where('employer_id', $employer->id)->first())
        ->status->toBe(PaymentStatus::Completed)
        ->method->toBe('complimentary')
        ->package_id->toBe($free->id);
});

test('paid package select without yallapay asks for manual bank transfer', function () {
    config()->set('services.yallapay.enabled', false);
    config()->set('services.yallapay.token', null);

    $employer = User::factory()->employer()->create([
        'package' => EmployerPackage::Professional,
    ]);

    $premium = Package::factory()->create([
        'slug' => EmployerPackage::Premium->value,
        'name' => EmployerPackage::Premium->label(),
        'price' => 999,
        'currency' => 'SDG',
        'is_public' => true,
        'is_active' => true,
    ]);

    $this->actingAs($employer)
        ->from(route('employer.packages'))
        ->post(route('employer.packages.select', $premium))
        ->assertRedirect(route('employer.packages'))
        ->assertSessionHas('error', 'Online checkout is unavailable. Please submit a bank transfer receipt for review.');

    expect(Payment::query()->where('employer_id', $employer->id)->exists())->toBeFalse();
});
