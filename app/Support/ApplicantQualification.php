<?php

namespace App\Support;

use App\Models\JobSeekerProfile;

class ApplicantQualification
{
    /**
     * Keyword groups keyed by qualification level, highest first.
     *
     * @var array<int, list<string>>
     */
    private const LEVELS = [
        6 => ['phd', 'ph.d', 'doctor', 'dphil'],
        5 => ['master', 'msc', 'm.sc', 'mba', 'mphil', 'postgraduate'],
        4 => ['bachelor', 'bsc', 'b.sc', 'bba', 'btech', 'undergraduate', 'honours'],
        3 => ['diploma', 'associate'],
        2 => ['certificate', 'hsc', 'a-level', 'a level', 'intermediate'],
    ];

    /**
     * Rank of the highest qualification in the profile education entries (0 when none).
     */
    public static function rank(?JobSeekerProfile $profile): int
    {
        return self::best($profile)['rank'];
    }

    /**
     * Name of the highest qualification, e.g. "Master of Business Administration".
     */
    public static function label(?JobSeekerProfile $profile): string
    {
        return self::best($profile)['label'];
    }

    public static function certificateCount(?JobSeekerProfile $profile): int
    {
        return is_array($profile?->certifications) ? count($profile->certifications) : 0;
    }

    /**
     * @return array{rank: int, label: string}
     */
    private static function best(?JobSeekerProfile $profile): array
    {
        $best = ['rank' => 0, 'label' => ''];

        if (! is_array($profile?->education)) {
            return $best;
        }

        foreach ($profile->education as $entry) {
            if (! is_array($entry)) {
                continue;
            }

            $degree = trim((string) ($entry['degree'] ?? $entry['title'] ?? ''));

            if ($degree === '') {
                continue;
            }

            $rank = self::levelFor($degree);

            if ($best['label'] === '' || $rank > $best['rank']) {
                $best = ['rank' => $rank, 'label' => $degree];
            }
        }

        return $best;
    }

    private static function levelFor(string $degree): int
    {
        $haystack = mb_strtolower($degree);

        foreach (self::LEVELS as $rank => $keywords) {
            foreach ($keywords as $keyword) {
                if (str_contains($haystack, $keyword)) {
                    return $rank;
                }
            }
        }

        return 1;
    }
}
