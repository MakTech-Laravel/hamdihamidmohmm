<?php

namespace App\Services\Stripe;

class StripeMoney
{
    /**
     * @var list<string>
     */
    private const ZERO_DECIMAL_CURRENCIES = [
        'bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga',
        'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf',
    ];

    public static function toUnitAmount(int $majorUnits, string $currency): int
    {
        $currency = strtolower($currency);

        if (in_array($currency, self::ZERO_DECIMAL_CURRENCIES, true)) {
            return $majorUnits;
        }

        return $majorUnits * 100;
    }

    public static function toMajorAmount(int $unitAmount, string $currency): int
    {
        $currency = strtolower($currency);

        if (in_array($currency, self::ZERO_DECIMAL_CURRENCIES, true)) {
            return $unitAmount;
        }

        return (int) floor($unitAmount / 100);
    }

    public static function interval(string $billingPeriod): string
    {
        $period = strtolower(trim($billingPeriod));

        return match (true) {
            str_contains($period, 'year') => 'year',
            str_contains($period, 'week') => 'week',
            str_contains($period, 'day') => 'day',
            default => 'month',
        };
    }
}
