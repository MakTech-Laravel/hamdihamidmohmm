<?php

namespace App\Support;

final class Locale
{
    public const ENGLISH = 'en';

    public const ARABIC = 'ar';

    public const COOKIE = 'locale';

    /**
     * @return list<string>
     */
    public static function supported(): array
    {
        return [self::ENGLISH, self::ARABIC];
    }

    public static function isSupported(string $locale): bool
    {
        return in_array($locale, self::supported(), true);
    }

    public static function normalize(?string $locale, string $fallback = self::ENGLISH): string
    {
        if ($locale === null || ! self::isSupported($locale)) {
            return $fallback;
        }

        return $locale;
    }

    public static function direction(string $locale): string
    {
        return $locale === self::ARABIC ? 'rtl' : 'ltr';
    }

    public static function isRtl(string $locale): bool
    {
        return self::direction($locale) === 'rtl';
    }

    public static function label(string $locale): string
    {
        return match ($locale) {
            self::ARABIC => 'العربية',
            default => 'English',
        };
    }
}
