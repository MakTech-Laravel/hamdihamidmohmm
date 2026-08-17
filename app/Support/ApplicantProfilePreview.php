<?php

namespace App\Support;

use App\Models\JobApplication;
use App\Models\JobSeekerProfile;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

class ApplicantProfilePreview
{
    /**
     * @return array{
     *     name: string,
     *     title: string,
     *     headline: string|null,
     *     current_title: string|null,
     *     experience_years: string,
     *     email: string,
     *     phone: string,
     *     location: string,
     *     preview_location: string,
     *     bio: string|null,
     *     linkedin_url: string|null,
     *     github_url: string|null,
     *     industry: string|null,
     *     expected_salary: string|null,
     *     availability: list<string>,
     *     skills: list<string>,
     *     education: list<array{title: string, subtitle: string|null, meta: string|null, body: string|null}>,
     *     experience: list<array{title: string, subtitle: string|null, meta: string|null, body: string|null}>,
     *     languages: list<array{name: string, level: string|null}>,
     *     certifications: list<array{name: string, issuer: string|null, date: string|null}>,
     *     cover_letter: string|null,
     *     resume_name: string|null,
     *     has_resume_file: bool
     * }
     */
    public static function from(User $seeker, ?JobApplication $application = null): array
    {
        $seeker->loadMissing('jobSeekerProfile');

        $profile = $seeker->jobSeekerProfile;
        $experienceYears = $profile?->experienceLabel() ?? '—';
        $location = filled($seeker->location) ? (string) $seeker->location : '—';

        return [
            'name' => filled($seeker->name) ? (string) $seeker->name : 'Applicant',
            'title' => self::displayTitle($profile),
            'headline' => self::nullableString($profile?->headline),
            'current_title' => self::nullableString($profile?->current_title),
            'experience_years' => $experienceYears,
            'email' => filled($seeker->email) ? (string) $seeker->email : '—',
            'phone' => filled($seeker->phone) ? (string) $seeker->phone : '—',
            'location' => $location,
            'preview_location' => self::previewLocation($location, $experienceYears),
            'bio' => self::nullableString($profile?->bio),
            'linkedin_url' => self::nullableString($profile?->linkedin_url),
            'github_url' => self::nullableString($profile?->github_url),
            'industry' => self::nullableString($profile?->industry),
            'expected_salary' => self::nullableString($profile?->expected_salary),
            'availability' => self::stringList($profile?->availability),
            'skills' => self::stringList($profile?->skills),
            'education' => self::entries($profile?->education, ['degree', 'title'], ['school', 'institution'], ['years', 'dates']),
            'experience' => self::entries($profile?->experience, ['title', 'role'], ['company'], ['dates', 'years'], ['description']),
            'languages' => self::languages($profile?->languages),
            'certifications' => self::certifications($profile?->certifications),
            'cover_letter' => self::nullableString($application?->cover_letter),
            'resume_name' => self::resumeName($seeker, $application),
            'has_resume_file' => self::hasResumeFile($seeker, $application),
        ];
    }

    public static function hasResumeFile(User $seeker, ?JobApplication $application = null): bool
    {
        if (
            $application !== null
            && filled($application->resume_path)
            && Storage::disk('local')->exists((string) $application->resume_path)
        ) {
            return true;
        }

        return filled($seeker->resume_path)
            && Storage::disk('local')->exists((string) $seeker->resume_path);
    }

    public static function resumeName(User $seeker, ?JobApplication $application = null): ?string
    {
        if (
            $application !== null
            && filled($application->resume_path)
            && Storage::disk('local')->exists((string) $application->resume_path)
        ) {
            return filled($application->resume_original_name)
                ? (string) $application->resume_original_name
                : basename((string) $application->resume_path);
        }

        if (filled($seeker->resume_path) && Storage::disk('local')->exists((string) $seeker->resume_path)) {
            return filled($seeker->resume_original_name)
                ? (string) $seeker->resume_original_name
                : basename((string) $seeker->resume_path);
        }

        return null;
    }

    private static function displayTitle(?JobSeekerProfile $profile): string
    {
        if (filled($profile?->headline)) {
            return (string) $profile->headline;
        }

        if (filled($profile?->current_title)) {
            return (string) $profile->current_title;
        }

        return 'Applicant';
    }

    private static function previewLocation(string $location, string $experience): string
    {
        if ($experience === '—' || $experience === '') {
            return $location;
        }

        if ($location === '—') {
            return $experience;
        }

        return $location.' · '.$experience;
    }

    private static function nullableString(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }

    /**
     * @return list<string>
     */
    private static function stringList(mixed $items): array
    {
        if (! is_array($items)) {
            return [];
        }

        return array_values(array_filter(
            $items,
            fn (mixed $item): bool => is_string($item) && trim($item) !== '',
        ));
    }

    /**
     * @param  list<string>  $titleKeys
     * @param  list<string>  $subtitleKeys
     * @param  list<string>  $metaKeys
     * @param  list<string>  $bodyKeys
     * @return list<array{title: string, subtitle: string|null, meta: string|null, body: string|null}>
     */
    private static function entries(
        mixed $items,
        array $titleKeys,
        array $subtitleKeys,
        array $metaKeys,
        array $bodyKeys = [],
    ): array {
        if (! is_array($items)) {
            return [];
        }

        $entries = [];

        foreach ($items as $item) {
            if (is_string($item) && trim($item) !== '') {
                $entries[] = [
                    'title' => trim($item),
                    'subtitle' => null,
                    'meta' => null,
                    'body' => null,
                ];

                continue;
            }

            if (! is_array($item)) {
                continue;
            }

            $title = self::field($item, $titleKeys);

            if ($title === null) {
                continue;
            }

            $entries[] = [
                'title' => $title,
                'subtitle' => self::field($item, $subtitleKeys),
                'meta' => self::field($item, $metaKeys),
                'body' => self::field($item, $bodyKeys),
            ];
        }

        return $entries;
    }

    /**
     * @return list<array{name: string, level: string|null}>
     */
    private static function languages(mixed $items): array
    {
        if (! is_array($items)) {
            return [];
        }

        $languages = [];

        foreach ($items as $item) {
            if (is_string($item) && trim($item) !== '') {
                $languages[] = ['name' => trim($item), 'level' => null];

                continue;
            }

            if (! is_array($item)) {
                continue;
            }

            $name = self::field($item, ['name', 'language']);

            if ($name === null) {
                continue;
            }

            $languages[] = [
                'name' => $name,
                'level' => self::field($item, ['level']),
            ];
        }

        return $languages;
    }

    /**
     * @return list<array{name: string, issuer: string|null, date: string|null}>
     */
    private static function certifications(mixed $items): array
    {
        if (! is_array($items)) {
            return [];
        }

        $certifications = [];

        foreach ($items as $item) {
            if (is_string($item) && trim($item) !== '') {
                $certifications[] = [
                    'name' => trim($item),
                    'issuer' => null,
                    'date' => null,
                ];

                continue;
            }

            if (! is_array($item)) {
                continue;
            }

            $name = self::field($item, ['name', 'title']);

            if ($name === null) {
                continue;
            }

            $certifications[] = [
                'name' => $name,
                'issuer' => self::field($item, ['issuer', 'org']),
                'date' => self::field($item, ['date', 'year']),
            ];
        }

        return $certifications;
    }

    /**
     * @param  array<mixed>  $item
     * @param  list<string>  $keys
     */
    private static function field(array $item, array $keys): ?string
    {
        foreach ($keys as $key) {
            $value = $item[$key] ?? null;

            if (is_string($value) && trim($value) !== '') {
                return trim($value);
            }

            if (is_int($value) || is_float($value)) {
                return (string) $value;
            }
        }

        return null;
    }
}
