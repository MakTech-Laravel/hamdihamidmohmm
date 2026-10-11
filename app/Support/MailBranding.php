<?php

namespace App\Support;

use App\Models\PlatformSetting;

class MailBranding
{
    /**
     * @var array<string, array{label: string, icon: string}>
     */
    private const SOCIAL_NETWORKS = [
        'facebook_url' => ['label' => 'Facebook', 'icon' => 'images/email/facebook.png'],
        'twitter_url' => ['label' => 'X', 'icon' => 'images/email/x.png'],
        'linkedin_url' => ['label' => 'LinkedIn', 'icon' => 'images/email/linkedin.png'],
        'instagram_url' => ['label' => 'Instagram', 'icon' => 'images/email/instagram.png'],
    ];

    /**
     * @return array{
     *     brandName: string,
     *     year: int,
     *     homeUrl: string,
     *     privacyUrl: string,
     *     termsUrl: string,
     *     socialLinks: list<array{label: string, url: string, icon: string}>,
     *     footerWaveUrl: string
     * }
     */
    public static function footer(): array
    {
        return [
            'brandName' => (string) config('app.name'),
            'year' => (int) now()->year,
            'homeUrl' => url('/'),
            'privacyUrl' => url('/#privacy'),
            'termsUrl' => url('/#terms'),
            'socialLinks' => self::socialLinks(),
            'footerWaveUrl' => asset('images/email/footer-wave.png'),
        ];
    }

    /**
     * @return list<array{label: string, url: string, icon: string}>
     */
    public static function socialLinks(): array
    {
        $social = PlatformSetting::grouped()['social'] ?? [];
        $links = [];

        foreach (self::SOCIAL_NETWORKS as $key => $network) {
            $url = self::normalizeUrl($social[$key] ?? null);

            if ($url === null) {
                continue;
            }

            $links[] = [
                'label' => $network['label'],
                'url' => $url,
                'icon' => asset($network['icon']),
            ];
        }

        return $links;
    }

    private static function normalizeUrl(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $trimmed = trim($value);

        if ($trimmed === '' || $trimmed === '#') {
            return null;
        }

        if (preg_match('/^https?:\/\//i', $trimmed) === 1) {
            return $trimmed;
        }

        return 'https://'.$trimmed;
    }
}
