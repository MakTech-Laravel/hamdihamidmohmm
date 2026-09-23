<?php

use App\Support\PlatformMoney;

test('platform money normalizes supported currencies and falls back to SDG', function () {
    expect(PlatformMoney::normalizePlatformCurrency('usd'))->toBe('USD')
        ->and(PlatformMoney::normalizePlatformCurrency('EUR'))->toBe('EUR')
        ->and(PlatformMoney::normalizePlatformCurrency('sdg'))->toBe('SDG')
        ->and(PlatformMoney::normalizePlatformCurrency('xyz'))->toBe('SDG')
        ->and(PlatformMoney::normalizePlatformCurrency(null))->toBe('SDG');
});

test('platform money exposes the accepted currency list', function () {
    expect(PlatformMoney::PLATFORM_CURRENCIES)->toBe(['SDG', 'USD', 'EUR']);
});
