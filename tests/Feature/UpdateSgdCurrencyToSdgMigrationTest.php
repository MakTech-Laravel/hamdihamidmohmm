<?php

use App\Models\Package;
use App\Models\Payment;

test('sgd currency migration converts stored package currencies to sdg', function () {
    $package = Package::factory()->create([
        'currency' => 'SGD',
    ]);

    $migration = require database_path('migrations/2026_08_24_033057_update_sgd_currency_values_to_sdg.php');
    $migration->up();

    expect($package->fresh()?->currency)->toBe('SDG');
});

test('sgd currency migration converts payment currency codes to sdg', function () {
    $payment = Payment::factory()->create([
        'currency' => 'SGD',
    ]);

    $migration = require database_path('migrations/2026_08_24_033057_update_sgd_currency_values_to_sdg.php');
    $migration->up();

    expect($payment->fresh()?->currency)->toBe('SDG');
});
