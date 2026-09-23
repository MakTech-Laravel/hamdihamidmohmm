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
}
