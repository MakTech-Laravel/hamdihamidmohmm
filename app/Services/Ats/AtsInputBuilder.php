<?php

namespace App\Services\Ats;

use App\Models\JobApplication;
use App\Models\JobPost;
use App\Support\JobSeekerCvExtractor;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class AtsInputBuilder
{
    public const VERSION = 'ats-v1';

    private const SECTION_LIMIT = 6000;

    /**
     * @return array{
     *     title: string,
     *     category: string,
     *     experience_level: string,
     *     employment_type: string,
     *     location: string,
     *     skills: list<string>,
     *     requirements: string,
     *     description: string
     * }
     */
    public function jobContext(JobPost $job): array
    {
        $skills = collect(is_array($job->skills) ? $job->skills : [])
            ->map(fn (mixed $skill): string => trim((string) $skill))
            ->filter()
            ->unique(fn (string $skill): string => Str::lower($skill))
            ->values()
            ->all();

        return [
            'title' => trim((string) $job->title),
            'category' => trim((string) $job->category),
            'experience_level' => trim((string) $job->experience_level),
            'employment_type' => trim((string) $job->employment_type),
            'location' => trim((string) $job->location),
            'skills' => $skills,
            'requirements' => $this->plainText($job->requirements),
            'description' => $this->plainText($job->description),
        ];
    }

    /**
     * Hash of the job fields that influence scoring, used to flag outdated scores.
     *
     * @param  array<string, mixed>  $jobContext
     */
    public function jobHash(array $jobContext): string
    {
        return hash('sha256', self::VERSION.'|'.json_encode($jobContext));
    }

    /**
     * Load the CV snapshot attached to the application. Null when the application has no usable CV file.
     *
     * @return array{
     *     path: string,
     *     extension: string,
     *     original_name: string,
     *     text: string,
     *     readable: bool,
     *     file_hash: string
     * }|null
     */
    public function cvDocument(JobApplication $application): ?array
    {
        $path = (string) $application->resume_path;
        $disk = Storage::disk('local');

        if ($path === '' || ! $disk->exists($path)) {
            return null;
        }

        $absolutePath = $disk->path($path);
        $extension = Str::lower(pathinfo($path, PATHINFO_EXTENSION) ?: pathinfo((string) $application->resume_original_name, PATHINFO_EXTENSION) ?: '');

        try {
            $text = JobSeekerCvExtractor::readableText(JobSeekerCvExtractor::textFromPath($absolutePath, $extension));
        } catch (Throwable $exception) {
            report($exception);
            $text = '';
        }

        $text = Str::limit($this->redact($text), max(1000, (int) config('ai.ats.max_cv_chars', 15000)), '');

        return [
            'path' => $path,
            'extension' => $extension,
            'original_name' => (string) ($application->resume_original_name ?: basename($path)),
            'text' => $text,
            'readable' => mb_strlen($text) >= (int) config('ai.ats.min_text_chars', 200),
            'file_hash' => (string) (hash_file('sha256', $absolutePath) ?: hash('sha256', $path)),
        ];
    }

    /**
     * @param  array<string, mixed>  $job
     * @param  array{file_hash: string}  $cv
     */
    public function inputHash(array $job, array $cv): string
    {
        return hash('sha256', self::VERSION.'|'.json_encode($job).'|'.$cv['file_hash']);
    }

    /**
     * Remove direct contact details before CV text leaves the server.
     */
    public function redact(string $text): string
    {
        $text = preg_replace('/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/i', '[email]', $text) ?? $text;
        $text = preg_replace('/\b(?:https?:\/\/|www\.)\S+/i', '[link]', $text) ?? $text;

        return preg_replace_callback('/\+?\(?\d[\d\s().\-]{6,}\d/', function (array $match): string {
            $digits = preg_replace('/\D/', '', $match[0]) ?? '';

            if (strlen($digits) < 9) {
                return $match[0];
            }

            preg_match_all('/\d+/', $match[0], $groups);
            $allYears = collect($groups[0])->every(fn (string $group): bool => (bool) preg_match('/^(19|20)\d{2}$/', $group));

            return $allYears ? $match[0] : '[phone]';
        }, $text) ?? $text;
    }

    private function plainText(?string $html): string
    {
        if (! filled($html)) {
            return '';
        }

        $text = preg_replace('/<(br|\/p|\/li|\/h[1-6]|\/div)\s*\/?>/i', "\n", (string) $html) ?? (string) $html;
        $text = html_entity_decode(strip_tags($text), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = preg_replace("/[ \t]+/", ' ', $text) ?? $text;
        $text = preg_replace("/\n\s*\n+/", "\n", $text) ?? $text;

        return Str::limit(trim($text), self::SECTION_LIMIT, '');
    }
}
