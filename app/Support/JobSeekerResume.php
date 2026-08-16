<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Str;

class JobSeekerResume
{
    public static function filename(User $seeker): string
    {
        $name = Str::slug($seeker->name ?: 'candidate');

        return $name.'-resume.pdf';
    }

    public static function contents(User $seeker): string
    {
        $profile = $seeker->jobSeekerProfile;
        $skills = self::list($profile?->skills);
        $education = self::entries($profile?->education, ['degree', 'school']);
        $experience = self::entries($profile?->experience, ['title', 'company']);
        $languages = self::list($profile?->languages);
        $certifications = self::list($profile?->certifications);

        $sections = [
            $seeker->name ?: 'Candidate',
            $profile?->headline,
            '',
            'Contact',
            'Email: '.($seeker->email ?: '—'),
            'Phone: '.($seeker->phone ?: '—'),
            'Location: '.($seeker->location ?: '—'),
            '',
            'Summary',
            filled($profile?->bio) ? $profile->bio : '—',
            '',
            'Skills',
            $skills,
            '',
            'Experience',
            $experience,
            '',
            'Education',
            $education,
            '',
            'Languages',
            $languages,
            '',
            'Certifications',
            $certifications,
        ];

        return implode("\n", $sections)."\n";
    }

    public static function pdf(User $seeker): string
    {
        return self::buildPdf(self::contents($seeker));
    }

    private static function list(mixed $items): string
    {
        if (! is_array($items) || $items === []) {
            return '—';
        }

        $values = array_values(array_filter(
            $items,
            fn (mixed $item): bool => is_string($item) && $item !== '',
        ));

        return $values === [] ? '—' : implode(', ', $values);
    }

    /**
     * @param  list<string>  $keys
     */
    private static function entries(mixed $items, array $keys): string
    {
        if (! is_array($items) || $items === []) {
            return '—';
        }

        $lines = [];

        foreach ($items as $item) {
            if (is_string($item) && $item !== '') {
                $lines[] = $item;

                continue;
            }

            if (! is_array($item)) {
                continue;
            }

            $parts = [];

            foreach ($keys as $key) {
                $value = $item[$key] ?? null;

                if (is_string($value) && $value !== '') {
                    $parts[] = $value;
                }
            }

            if (isset($item['years']) && is_numeric($item['years'])) {
                $years = (int) $item['years'];
                $parts[] = $years === 1 ? '1 year' : $years.' years';
            }

            if ($parts !== []) {
                $lines[] = implode(' · ', $parts);
            }
        }

        return $lines === [] ? '—' : implode("\n", $lines);
    }

    private static function buildPdf(string $text): string
    {
        $lines = [];

        foreach (preg_split("/\r\n|\n|\r/", $text) ?: [''] as $line) {
            if ($line === '') {
                $lines[] = '';

                continue;
            }

            foreach (explode("\n", wordwrap($line, 88, "\n", true)) as $wrapped) {
                $lines[] = $wrapped;
            }
        }

        $pageWidth = 612;
        $pageHeight = 792;
        $margin = 54;
        $fontSize = 11;
        $leading = 14;
        $usableHeight = $pageHeight - ($margin * 2);
        $maxLines = max(1, (int) floor($usableHeight / $leading));
        $pages = array_chunk($lines === [] ? [''] : $lines, $maxLines);

        $objects = [
            1 => '<< /Type /Catalog /Pages 2 0 R >>',
            2 => '',
            3 => '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        ];

        $pageIds = [];
        $nextId = 4;

        foreach ($pages as $pageLines) {
            $content = "BT\n/F1 {$fontSize} Tf\n{$leading} TL\n{$margin} ".($pageHeight - $margin - $fontSize)." Td\n";

            foreach ($pageLines as $index => $line) {
                $escaped = self::pdfEscape($line);

                if ($index === 0) {
                    $content .= "({$escaped}) Tj\n";
                } else {
                    $content .= "T*\n({$escaped}) Tj\n";
                }
            }

            $content .= 'ET';

            $contentId = $nextId++;
            $pageId = $nextId++;
            $objects[$contentId] = '<< /Length '.strlen($content)." >>\nstream\n{$content}\nendstream";
            $objects[$pageId] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {$pageWidth} {$pageHeight}] /Contents {$contentId} 0 R /Resources << /Font << /F1 3 0 R >> >> >>";
            $pageIds[] = $pageId;
        }

        $kids = implode(' ', array_map(fn (int $id): string => "{$id} 0 R", $pageIds));
        $objects[2] = '<< /Type /Pages /Kids ['.$kids.'] /Count '.count($pageIds).' >>';

        ksort($objects);

        $pdf = "%PDF-1.4\n";
        $offsets = [];

        foreach ($objects as $id => $body) {
            $offsets[$id] = strlen($pdf);
            $pdf .= "{$id} 0 obj\n{$body}\nendobj\n";
        }

        $xref = strlen($pdf);
        $size = max(array_keys($objects)) + 1;
        $pdf .= "xref\n0 {$size}\n0000000000 65535 f \n";

        for ($id = 1; $id < $size; $id++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$id]);
        }

        $pdf .= "trailer\n<< /Size {$size} /Root 1 0 R >>\nstartxref\n{$xref}\n%%EOF";

        return $pdf;
    }

    private static function pdfEscape(string $line): string
    {
        $converted = @iconv('UTF-8', 'Windows-1252//TRANSLIT//IGNORE', $line);

        if (! is_string($converted)) {
            $converted = preg_replace('/[^\x20-\x7E]/', '?', $line) ?? $line;
        }

        return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $converted);
    }
}
