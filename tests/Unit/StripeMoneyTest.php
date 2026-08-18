<?php

use App\Services\Stripe\StripeMoney;

test('stripe money converts major units for two decimal and zero decimal currencies', function () {
    expect(StripeMoney::toUnitAmount(999, 'SAR'))->toBe(99900)
        ->and(StripeMoney::toMajorAmount(99900, 'SAR'))->toBe(999)
        ->and(StripeMoney::toUnitAmount(299, 'usd'))->toBe(29900)
        ->and(StripeMoney::toUnitAmount(100, 'JPY'))->toBe(100)
        ->and(StripeMoney::toMajorAmount(100, 'JPY'))->toBe(100);
});

test('stripe money maps billing periods to recurring intervals', function () {
    expect(StripeMoney::interval('month'))->toBe('month')
        ->and(StripeMoney::interval('monthly'))->toBe('month')
        ->and(StripeMoney::interval('year'))->toBe('year')
        ->and(StripeMoney::interval('weekly'))->toBe('week');
});
