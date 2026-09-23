<?php

namespace App\Support;

class PlatformMoney
{
    /**
     * Currencies accepted in the admin package form.
     *
     * @var list<string>
     */
    public const PLATFORM_CURRENCIES = ['SDG', 'USD', 'EUR'];

    public static function normalizePlatformCurrency(?string $currency): string
    {
        $normalized = strtoupper(trim((string) $currency));

        if (! in_array($normalized, self::PLATFORM_CURRENCIES, true)) {
            return 'SDG';
        }

        return $normalized;
    }
}
