<?php

use App\Models\JobPost;
use App\Models\Payment;

test('aed currency migration converts stored salary ranges to sgd', function () {
    $job = JobPost::factory()->create([
        'salary_range' => 'AED 18,000 - 25,000',
    ]);

    $migration = require database_path('migrations/2026_08_23_101843_update_aed_currency_values_to_sgd.php');
    $migration->up();

    expect($job->fresh()?->salary_range)->toBe('SGD 18,000 - 25,000');
});

test('aed currency migration converts payment currency codes to sgd', function () {
    $payment = Payment::factory()->create([
        'currency' => 'AED',
    ]);

    $migration = require database_path('migrations/2026_08_23_101843_update_aed_currency_values_to_sgd.php');
    $migration->up();

    expect($payment->fresh()?->currency)->toBe('SGD');
});
