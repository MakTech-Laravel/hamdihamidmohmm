<?php

namespace App\Support;

class ExternalApplyDestination
{
    public const MAX_LENGTH = 2048;

    public static function prepare(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $trimmed = trim((string) $value);

        if ($trimmed === '') {
            return null;
        }

        if (str_starts_with(strtolower($trimmed), 'mailto:')) {
            $trimmed = trim(substr($trimmed, 7));
        }

        return $trimmed !== '' ? $trimmed : null;
    }

    public static function isValid(?string $value): bool
    {
        if ($value === null || $value === '') {
            return true;
        }

        if (mb_strlen($value) > self::MAX_LENGTH) {
            return false;
        }

        if (filter_var($value, FILTER_VALIDATE_EMAIL) !== false) {
            return true;
        }

        if (! filter_var($value, FILTER_VALIDATE_URL)) {
            return false;
        }

        $scheme = strtolower((string) parse_url($value, PHP_URL_SCHEME));

        return in_array($scheme, ['http', 'https'], true);
    }

    public static function isEmail(?string $value): bool
    {
        if ($value === null || $value === '') {
            return false;
        }

        return filter_var($value, FILTER_VALIDATE_EMAIL) !== false;
    }

    public static function href(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (self::isEmail($value)) {
            return 'mailto:'.$value;
        }

        return $value;
    }

    /**
     * @return list<string|\Closure(string, mixed, \Closure): void>
     */
    public static function rules(): array
    {
        return [
            'nullable',
            'string',
            'max:'.self::MAX_LENGTH,
            function (string $attribute, mixed $value, \Closure $fail): void {
                if ($value === null || $value === '') {
                    return;
                }

                if (! is_string($value) || ! self::isValid($value)) {
                    $fail('Please enter a valid Apply by Link URL or email address.');
                }
            },
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function messages(string $attribute = 'career_portal_url'): array
    {
        return [
            "{$attribute}.max" => 'The Apply by Link destination may not be greater than '.self::MAX_LENGTH.' characters.',
        ];
    }
}
