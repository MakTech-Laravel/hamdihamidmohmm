<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use ZipArchive;

class JobSeekerCvExtractor
{
    /**
     * @return array{
     *     name: ?string,
     *     phone: ?string,
     *     location: ?string,
     *     headline: ?string,
     *     current_title: ?string,
     *     bio: ?string,
     *     linkedin_url: ?string,
     *     github_url: ?string,
     *     skills: list<string>,
     *     education: list<array{degree: string, school: string, field: string, years: string}>,
     *     experience: list<array{title: string, company: string, dates: string, description: string}>,
     *     languages: list<array{name: string, level: string}>,
     *     certifications: list<array{name: string, issuer: string, date: string}>
     * }
     */
    public static function extract(UploadedFile $file): array
    {
        $text = self::textFromFile($file);

        return self::parse($text);
    }

    public static function textFromFile(UploadedFile $file): string
    {
        $extension = Str::lower($file->getClientOriginalExtension() ?: $file->extension() ?: '');
        $path = $file->getRealPath() ?: $file->getPathname();

        return match ($extension) {
            'docx' => self::textFromDocx($path),
            'doc' => self::textFromBinary($path),
            'pdf' => self::textFromPdf($path),
            default => self::textFromBinary($path),
        };
    }

    /**
     * @return array{
     *     name: ?string,
     *     phone: ?string,
     *     location: ?string,
     *     headline: ?string,
     *     current_title: ?string,
     *     bio: ?string,
     *     linkedin_url: ?string,
     *     github_url: ?string,
     *     skills: list<string>,
     *     education: list<array{degree: string, school: string, field: string, years: string}>,
     *     experience: list<array{title: string, company: string, dates: string, description: string}>,
     *     languages: list<array{name: string, level: string}>,
     *     certifications: list<array{name: string, issuer: string, date: string}>
     * }
     */
    public static function parse(string $text): array
    {
        $normalized = self::normalizeText($text);
        $lines = self::lines($normalized);

        $email = self::firstMatch('/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/i', $normalized);
        $phone = self::sanitizeString(
            self::firstMatch('/(?:\+\d{1,3}[\s\-]?)?(?:\(?\d{2,4}\)?[\s\-]?)?\d{3,4}[\s\-]?\d{3,4}(?:[\s\-]?\d{2,4})?/', $normalized),
            40,
        );
        $linkedin = self::sanitizeString(
            self::firstMatch('/https?:\/\/(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9\-_%]+\/?/i', $normalized)
                ?? self::firstMatch('/linkedin\.com\/in\/[A-Za-z0-9\-_%]+\/?/i', $normalized),
            255,
        );
        $github = self::sanitizeString(
            self::firstMatch('/https?:\/\/(?:www\.)?github\.com\/[A-Za-z0-9\-]+\/?/i', $normalized)
                ?? self::firstMatch('/github\.com\/[A-Za-z0-9\-]+\/?/i', $normalized),
            255,
        );

        if ($linkedin !== null && ! str_starts_with(Str::lower($linkedin), 'http')) {
            $linkedin = 'https://' . $linkedin;
        }

        if ($github !== null && ! str_starts_with(Str::lower($github), 'http')) {
            $github = 'https://' . $github;
        }

        $name = self::sanitizeString(self::guessName($lines, $email), 120);
        $headline = self::sanitizeString(self::guessHeadline($lines, $name, $email, $phone), 255);
        $location = self::sanitizeString(
            self::sectionValue($normalized, ['location', 'address', 'based in', 'city'])
                ?? self::guessLocation($lines),
            120,
        );
        $skills = array_values(array_filter(
            array_map(fn(string $skill): ?string => self::sanitizeString($skill, 100), self::listFromSection($normalized, ['skills', 'technical skills', 'core skills', 'key skills'])),
        ));
        $languages = collect(self::languagesFromSection($normalized))
            ->map(fn(array $entry): ?array => self::sanitizeLanguage($entry))
            ->filter()
            ->values()
            ->all();
        $education = collect(self::educationFromSection($normalized))
            ->map(fn(array $entry): ?array => self::sanitizeEducation($entry))
            ->filter()
            ->values()
            ->all();
        $experience = collect(self::experienceFromSection($normalized))
            ->map(fn(array $entry): ?array => self::sanitizeExperience($entry))
            ->filter()
            ->values()
            ->all();
        $certifications = collect(self::certificationsFromSection($normalized))
            ->map(fn(array $entry): ?array => self::sanitizeCertification($entry))
            ->filter()
            ->values()
            ->all();
        $bio = self::sanitizeString(
            self::paragraphFromSection($normalized, ['summary', 'profile', 'about me', 'objective', 'professional summary']),
            1000,
        );

        $currentTitle = $headline;

        if ($experience !== [] && filled($experience[0]['title'] ?? null)) {
            $currentTitle = $experience[0]['title'];
        }

        return [
            'name' => $name,
            'phone' => $phone,
            'location' => $location,
            'headline' => $headline,
            'current_title' => $currentTitle,
            'bio' => $bio,
            'linkedin_url' => $linkedin,
            'github_url' => $github,
            'skills' => $skills,
            'education' => $education,
            'experience' => $experience,
            'languages' => $languages,
            'certifications' => $certifications,
        ];
    }

    private static function textFromDocx(string $path): string
    {
        if (! class_exists(ZipArchive::class)) {
            return '';
        }

        $zip = new ZipArchive;

        if ($zip->open($path) !== true) {
            return '';
        }

        $xml = $zip->getFromName('word/document.xml') ?: '';
        $zip->close();

        if ($xml === '') {
            return '';
        }

        $xml = preg_replace('/<\/w:p>/', "\n", $xml) ?? $xml;
        $xml = strip_tags($xml);

        return html_entity_decode($xml, ENT_QUOTES | ENT_XML1, 'UTF-8');
    }

    private static function textFromPdf(string $path): string
    {
        $binary = @file_get_contents($path);

        if ($binary === false || $binary === '') {
            return '';
        }

        $chunks = [];

        if (preg_match_all('/\((\\\\.|[^\\\\)])*\)/s', $binary, $matches) > 0) {
            foreach ($matches[0] as $match) {
                $raw = substr($match, 1, -1);
                $raw = stripcslashes($raw);
                $cleaned = self::sanitizeString($raw, 500);

                if ($cleaned !== null) {
                    $chunks[] = $cleaned;
                }
            }
        }

        if (preg_match_all('/stream\s*(.*?)\s*endstream/s', $binary, $streams) > 0) {
            foreach ($streams[1] as $stream) {
                $decoded = @gzuncompress($stream)
                    ?: @gzinflate($stream)
                    ?: $stream;

                if (preg_match_all('/\((\\\\.|[^\\\\)])*\)/s', (string) $decoded, $streamMatches) > 0) {
                    foreach ($streamMatches[0] as $match) {
                        $raw = substr($match, 1, -1);
                        $raw = stripcslashes($raw);
                        $cleaned = self::sanitizeString($raw, 500);

                        if ($cleaned !== null) {
                            $chunks[] = $cleaned;
                        }
                    }
                }
            }
        }

        return implode("\n", $chunks);
    }

    private static function textFromBinary(string $path): string
    {
        $binary = @file_get_contents($path);

        if ($binary === false || $binary === '') {
            return '';
        }

        return self::normalizeText(self::sanitizeString($binary, 20000) ?? '');
    }

    private static function normalizeText(string $text): string
    {
        $text = self::toUtf8($text);
        $text = str_replace(["\r\n", "\r"], "\n", $text);
        $text = preg_replace('/[^\P{C}\n\t]+/u', ' ', $text) ?? $text;
        $text = preg_replace("/[ \t]+/", ' ', $text) ?? $text;
        $text = preg_replace("/\n{3,}/", "\n\n", $text) ?? $text;

        return trim($text);
    }

    /**
     * @return list<string>
     */
    private static function lines(string $text): array
    {
        return collect(preg_split('/\n+/', $text) ?: [])
            ->map(fn(string $line): string => trim($line))
            ->filter(fn(string $line): bool => $line !== '' && self::looksLikeReadableText($line))
            ->values()
            ->all();
    }

    private static function toUtf8(string $value): string
    {
        if ($value === '') {
            return '';
        }

        if (! mb_check_encoding($value, 'UTF-8')) {
            $value = mb_convert_encoding($value, 'UTF-8', 'UTF-8, ISO-8859-1, Windows-1252') ?: '';
        }

        $cleaned = @iconv('UTF-8', 'UTF-8//IGNORE', $value);

        return is_string($cleaned) ? $cleaned : '';
    }

    private static function sanitizeString(?string $value, int $maxLength = 255): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = self::toUtf8($value);
        $value = preg_replace('/[^\p{L}\p{N}\p{P}\p{Z}@+\-\/#&()\'.,:;]/u', '', $value) ?? '';
        $value = trim(preg_replace('/\s+/u', ' ', $value) ?? '');

        if ($value === '' || ! self::looksLikeReadableText($value)) {
            return null;
        }

        return Str::limit($value, $maxLength, '');
    }

    private static function looksLikeReadableText(string $value): bool
    {
        $compact = preg_replace('/\s+/u', '', $value) ?? '';
        $length = mb_strlen($compact);

        if ($length < 2) {
            return false;
        }

        // Prefer Latin / Arabic / digit characters. Reject mojibake from PDF binary blobs.
        preg_match_all('/[A-Za-z0-9\x{0600}-\x{06FF}]/u', $compact, $matches);
        $trusted = count($matches[0] ?? []);

        return ($trusted / $length) >= 0.7;
    }

    /**
     * @param  array{name: string, level: string}  $entry
     * @return array{name: string, level: string}|null
     */
    private static function sanitizeLanguage(array $entry): ?array
    {
        $name = self::sanitizeString($entry['name'] ?? null, 80);
        $level = self::sanitizeString($entry['level'] ?? null, 40) ?? 'Intermediate';

        if ($name === null) {
            return null;
        }

        return ['name' => $name, 'level' => $level];
    }

    /**
     * @param  array{degree: string, school: string, field: string, years: string}  $entry
     * @return array{degree: string, school: string, field: string, years: string}|null
     */
    private static function sanitizeEducation(array $entry): ?array
    {
        $degree = self::sanitizeString($entry['degree'] ?? null, 120) ?? '';
        $school = self::sanitizeString($entry['school'] ?? null, 120) ?? '';
        $field = self::sanitizeString($entry['field'] ?? null, 120) ?? '';
        $years = self::sanitizeString($entry['years'] ?? null, 40) ?? '';

        if ($degree === '' && $school === '' && $field === '' && $years === '') {
            return null;
        }

        return compact('degree', 'school', 'field', 'years');
    }

    /**
     * @param  array{title: string, company: string, dates: string, description: string}  $entry
     * @return array{title: string, company: string, dates: string, description: string}|null
     */
    private static function sanitizeExperience(array $entry): ?array
    {
        $title = self::sanitizeString($entry['title'] ?? null, 120) ?? '';
        $company = self::sanitizeString($entry['company'] ?? null, 120) ?? '';
        $dates = self::sanitizeString($entry['dates'] ?? null, 40) ?? '';
        $description = self::sanitizeString($entry['description'] ?? null, 500) ?? '';

        if ($title === '' && $company === '' && $dates === '' && $description === '') {
            return null;
        }

        return compact('title', 'company', 'dates', 'description');
    }

    /**
     * @param  array{name: string, issuer: string, date: string}  $entry
     * @return array{name: string, issuer: string, date: string}|null
     */
    private static function sanitizeCertification(array $entry): ?array
    {
        $name = self::sanitizeString($entry['name'] ?? null, 120) ?? '';
        $issuer = self::sanitizeString($entry['issuer'] ?? null, 120) ?? '';
        $date = self::sanitizeString($entry['date'] ?? null, 40) ?? '';

        if ($name === '' && $issuer === '' && $date === '') {
            return null;
        }

        return compact('name', 'issuer', 'date');
    }

    private static function firstMatch(string $pattern, string $text): ?string
    {
        if (preg_match($pattern, $text, $matches) !== 1) {
            return null;
        }

        $value = trim($matches[0]);

        return $value !== '' ? $value : null;
    }

    /**
     * @param  list<string>  $lines
     */
    private static function guessName(array $lines, ?string $email): ?string
    {
        foreach (array_slice($lines, 0, 8) as $line) {
            if ($email !== null && str_contains(Str::lower($line), Str::lower($email))) {
                continue;
            }

            if (preg_match('/@|https?:|linkedin|github|curriculum|resume|cv\b/i', $line) === 1) {
                continue;
            }

            if (preg_match('/^\+?\d/', $line) === 1) {
                continue;
            }

            if (str_word_count($line) >= 2 && str_word_count($line) <= 5 && mb_strlen($line) <= 60) {
                return Str::title($line);
            }
        }

        if ($email !== null) {
            $local = Str::before($email, '@');
            $local = str_replace(['.', '_', '-'], ' ', $local);

            if (trim($local) !== '') {
                return Str::title($local);
            }
        }

        return null;
    }

    /**
     * @param  list<string>  $lines
     */
    private static function guessHeadline(array $lines, ?string $name, ?string $email, ?string $phone): ?string
    {
        foreach (array_slice($lines, 0, 12) as $line) {
            if ($name !== null && Str::lower($line) === Str::lower($name)) {
                continue;
            }

            if ($email !== null && str_contains(Str::lower($line), Str::lower($email))) {
                continue;
            }

            if ($phone !== null && str_contains($line, preg_replace('/\s+/', '', $phone) ?? $phone)) {
                continue;
            }

            if (preg_match('/@|https?:|linkedin|github|education|experience|skills|languages/i', $line) === 1) {
                continue;
            }

            if (mb_strlen($line) >= 8 && mb_strlen($line) <= 80 && str_word_count($line) <= 10) {
                return $line;
            }
        }

        return null;
    }

    /**
     * @param  list<string>  $lines
     */
    private static function guessLocation(array $lines): ?string
    {
        foreach (array_slice($lines, 0, 15) as $line) {
            if (preg_match('/\b(dubai|abu dhabi|riyadh|jeddah|doha|kuwait|manama|muscat|cairo|khartoum|amman|beirut|london|remote)\b/i', $line, $matches) === 1) {
                return Str::title($matches[1]);
            }
        }

        return null;
    }

    /**
     * @param  list<string>  $labels
     */
    private static function sectionBody(string $text, array $labels): ?string
    {
        $labelPattern = collect($labels)
            ->map(fn(string $label): string => preg_quote($label, '/'))
            ->implode('|');

        $pattern = '/(?:^|\n)\s*(?:' . $labelPattern . ')\s*:?\s*\n(.*?)(?=\n\s*(?:education|experience|work experience|employment|skills|technical skills|languages|certifications?|projects|summary|profile|objective|references)\s*:?\s*\n|\z)/is';

        if (preg_match($pattern, "\n" . $text . "\n", $matches) !== 1) {
            return null;
        }

        $body = trim($matches[1]);

        return $body !== '' ? $body : null;
    }

    /**
     * @param  list<string>  $labels
     */
    private static function sectionValue(string $text, array $labels): ?string
    {
        $labelPattern = collect($labels)
            ->map(fn(string $label): string => preg_quote($label, '/'))
            ->implode('|');

        if (preg_match('/(?:' . $labelPattern . ')\s*[:\-]\s*(.+)/i', $text, $matches) === 1) {
            $value = trim(Str::before($matches[1], "\n"));

            return $value !== '' ? $value : null;
        }

        return null;
    }

    /**
     * @param  list<string>  $labels
     * @return list<string>
     */
    private static function listFromSection(string $text, array $labels): array
    {
        $body = self::sectionBody($text, $labels) ?? self::sectionValue($text, $labels);

        if ($body === null) {
            return [];
        }

        return collect(preg_split('/[\n,•|]+/', $body) ?: [])
            ->map(fn(string $item): string => trim($item, " \t\n\r\0\x0B-•"))
            ->filter(fn(string $item): bool => $item !== '' && mb_strlen($item) <= 80)
            ->unique(fn(string $item): string => Str::lower($item))
            ->take(30)
            ->values()
            ->all();
    }

    /**
     * @param  list<string>  $labels
     */
    private static function paragraphFromSection(string $text, array $labels): ?string
    {
        $body = self::sectionBody($text, $labels);

        if ($body === null) {
            return null;
        }

        $body = trim(preg_replace('/\s+/', ' ', $body) ?? $body);

        return $body !== '' ? Str::limit($body, 1000, '') : null;
    }

    /**
     * @return list<array{name: string, level: string}>
     */
    private static function languagesFromSection(string $text): array
    {
        $body = self::sectionBody($text, ['languages', 'language skills']) ?? '';
        $source = $body !== '' ? $body : $text;
        $known = ['English', 'Arabic', 'French'];
        $levels = ['Native', 'Advanced', 'Intermediate', 'Conversational', 'Beginner'];
        $found = [];

        foreach ($known as $language) {
            if (preg_match('/\b' . preg_quote($language, '/') . '\b(?:\s*[\(:\-]?\s*(' . implode('|', $levels) . '))?/i', $source, $matches) === 1) {
                $level = isset($matches[1]) ? Str::title($matches[1]) : 'Intermediate';
                $found[] = ['name' => $language, 'level' => $level];
            }
        }

        return $found;
    }

    /**
     * @return list<array{degree: string, school: string, field: string, years: string}>
     */
    private static function educationFromSection(string $text): array
    {
        $body = self::sectionBody($text, ['education', 'academic background', 'qualifications']);

        if ($body === null) {
            return [];
        }

        $entries = [];

        foreach (preg_split('/\n+/', $body) ?: [] as $line) {
            $line = trim($line);

            if ($line === '' || mb_strlen($line) < 5) {
                continue;
            }

            $years = self::firstMatch('/(?:19|20)\d{2}\s*[-–—to]+\s*(?:(?:19|20)\d{2}|present|current)/i', $line) ?? '';
            $degree = $line;

            if ($years !== '') {
                $degree = trim(str_ireplace($years, '', $degree), " \t-–—,|");
            }

            $entries[] = [
                'degree' => Str::limit($degree, 120, ''),
                'school' => '',
                'field' => '',
                'years' => $years,
            ];

            if (count($entries) >= 5) {
                break;
            }
        }

        return $entries;
    }

    /**
     * @return list<array{title: string, company: string, dates: string, description: string}>
     */
    private static function experienceFromSection(string $text): array
    {
        $body = self::sectionBody($text, ['experience', 'work experience', 'employment', 'professional experience']);

        if ($body === null) {
            return [];
        }

        $entries = [];

        foreach (preg_split('/\n+/', $body) ?: [] as $line) {
            $line = trim($line);

            if ($line === '' || mb_strlen($line) < 5) {
                continue;
            }

            $dates = self::firstMatch('/(?:19|20)\d{2}\s*[-–—to]+\s*(?:(?:19|20)\d{2}|present|current)/i', $line) ?? '';
            $title = $line;

            if ($dates !== '') {
                $title = trim(str_ireplace($dates, '', $title), " \t-–—,|");
            }

            $company = '';

            if (str_contains($title, ' at ')) {
                [$title, $company] = array_pad(explode(' at ', $title, 2), 2, '');
            } elseif (str_contains($title, ' - ')) {
                [$title, $company] = array_pad(explode(' - ', $title, 2), 2, '');
            } elseif (str_contains($title, '|')) {
                [$title, $company] = array_pad(explode('|', $title, 2), 2, '');
            }

            $entries[] = [
                'title' => Str::limit(trim($title), 120, ''),
                'company' => Str::limit(trim($company), 120, ''),
                'dates' => $dates,
                'description' => '',
            ];

            if (count($entries) >= 8) {
                break;
            }
        }

        return $entries;
    }

    /**
     * @return list<array{name: string, issuer: string, date: string}>
     */
    private static function certificationsFromSection(string $text): array
    {
        $body = self::sectionBody($text, ['certifications', 'certificates', 'licenses']);

        if ($body === null) {
            return [];
        }

        return collect(preg_split('/\n+/', $body) ?: [])
            ->map(fn(string $line): string => trim($line, " \t-•"))
            ->filter(fn(string $line): bool => $line !== '')
            ->take(8)
            ->map(fn(string $line): array => [
                'name' => Str::limit($line, 120, ''),
                'issuer' => '',
                'date' => self::firstMatch('/(?:19|20)\d{2}/', $line) ?? '',
            ])
            ->values()
            ->all();
    }
}
