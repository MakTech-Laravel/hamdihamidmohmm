<?php

namespace App\Models;

use Database\Factories\PlatformSettingFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PlatformSetting extends Model
{
    /** @use HasFactory<PlatformSettingFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'key',
        'value',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'value' => 'array',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function defaults(): array
    {
        return [
            'general' => [
                'platform_name' => 'RR Job Portal',
                'support_phone' => '+971 4 123 4567',
                'support_phone_secondary' => '+971 50 123 4567',
                'company_address' => 'Dubai Internet City, Building 12, Dubai, UAE',
                'support_email' => 'support@rrjobportal.ae',
                'website_url' => 'https://www.rrjobportal.ae',
                'contact_email' => 'contact@rrjobportal.ae',
            ],
            'email' => [
                'from_name' => 'RR Job Portal',
                'from_email' => 'noreply@rrjobportal.ae',
            ],
            'security' => [
                'require_email_verification' => true,
                'session_timeout_minutes' => 120,
            ],
            'language' => [
                'default_locale' => 'en',
            ],
            'social' => [
                'facebook_url' => '',
                'twitter_url' => '',
                'linkedin_url' => '',
                'instagram_url' => '',
            ],
            'payments' => [
                'bank_name' => '',
                'bank_account_name' => '',
                'bank_account_number' => '',
                'bank_iban' => '',
                'bank_instructions' => 'Transfer the package fee to the platform bank account, then upload your payment receipt for admin review.',
            ],
            'experience_filters' => [
                'ranges' => [
                    ['key' => '0-2', 'label' => '0-2 years', 'min' => 0, 'max' => 2, 'enabled' => true],
                    ['key' => '3-5', 'label' => '3-5 years', 'min' => 3, 'max' => 5, 'enabled' => true],
                    ['key' => '6-10', 'label' => '6-10 years', 'min' => 6, 'max' => 10, 'enabled' => true],
                    ['key' => '10+', 'label' => '10+ years', 'min' => 10, 'max' => null, 'enabled' => true],
                ],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function grouped(): array
    {
        $defaults = self::defaults();
        $stored = self::query()->pluck('value', 'key');

        foreach ($defaults as $key => $value) {
            $defaults[$key] = array_merge($value, $stored[$key] ?? []);
        }

        return $defaults;
    }

    /**
     * Public support contact details shown in the website footer and contact sections.
     *
     * @return array{
     *     support_phone: string|null,
     *     support_phone_secondary: string|null,
     *     support_email: string|null,
     *     contact_email: string|null,
     *     company_address: string|null
     * }
     */
    public static function publicContact(): array
    {
        $general = self::grouped()['general'] ?? [];

        return [
            'support_phone' => self::nullableString($general['support_phone'] ?? null),
            'support_phone_secondary' => self::nullableString($general['support_phone_secondary'] ?? null),
            'support_email' => self::nullableString($general['support_email'] ?? null),
            'contact_email' => self::nullableString($general['contact_email'] ?? null),
            'company_address' => self::nullableString($general['company_address'] ?? null),
        ];
    }

    private static function nullableString(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }
}
