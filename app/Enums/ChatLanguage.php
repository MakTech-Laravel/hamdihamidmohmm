<?php

namespace App\Enums;

enum ChatLanguage: string
{
    case Auto = 'auto';
    case English = 'en';
    case Arabic = 'ar';

    public function label(): string
    {
        return match ($this) {
            self::Auto => 'Auto',
            self::English => 'English',
            self::Arabic => 'Arabic',
        };
    }

    public static function fromLocale(string $locale): self
    {
        return $locale === self::Arabic->value ? self::Arabic : self::English;
    }

    /**
     * @return list<string>
     */
    public static function translationTargets(): array
    {
        return [self::English->value, self::Arabic->value];
    }
}
