<?php

namespace App\Support;

use App\Models\JobApplication;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ApplicantDocumentDownloader
{
    public static function highestDegree(User $seeker): StreamedResponse
    {
        abort_unless(
            filled($seeker->highest_degree_path)
                && Storage::disk('local')->exists((string) $seeker->highest_degree_path),
            404,
        );

        $downloadName = $seeker->highest_degree_original_name
            ?: basename((string) $seeker->highest_degree_path);

        return Storage::disk('local')->download((string) $seeker->highest_degree_path, $downloadName);
    }

    public static function otherDocument(User $seeker): StreamedResponse
    {
        abort_unless(
            filled($seeker->other_document_path)
                && Storage::disk('local')->exists((string) $seeker->other_document_path),
            404,
        );

        $downloadName = $seeker->other_document_original_name
            ?: basename((string) $seeker->other_document_path);

        return Storage::disk('local')->download((string) $seeker->other_document_path, $downloadName);
    }

    public static function coverLetter(User $seeker): StreamedResponse
    {
        abort_unless(
            filled($seeker->cover_letter_path)
                && Storage::disk('local')->exists((string) $seeker->cover_letter_path),
            404,
        );

        $downloadName = $seeker->cover_letter_original_name
            ?: basename((string) $seeker->cover_letter_path);

        return Storage::disk('local')->download((string) $seeker->cover_letter_path, $downloadName);
    }

    public static function certification(User $seeker, int $index, int $attachment = 0): StreamedResponse
    {
        $seeker->loadMissing('jobSeekerProfile');
        $certifications = is_array($seeker->jobSeekerProfile?->certifications)
            ? array_values($seeker->jobSeekerProfile->certifications)
            : [];
        $entry = $certifications[$index] ?? null;

        abort_unless(is_array($entry), 404);

        $attachments = self::normalizeAttachments($entry);
        $file = $attachments[$attachment] ?? null;

        abort_unless(
            is_array($file)
                && filled($file['file_path'] ?? null)
                && Storage::disk('local')->exists((string) $file['file_path']),
            404,
        );

        $downloadName = $file['file_name'] ?? basename((string) $file['file_path']);

        return Storage::disk('local')->download((string) $file['file_path'], $downloadName);
    }

    public static function seekerFromApplication(JobApplication $application): User
    {
        $application->loadMissing(['jobSeeker.jobSeekerProfile']);

        $seeker = $application->jobSeeker;
        abort_unless($seeker instanceof User && $seeker->isJobSeeker(), 404);

        return $seeker;
    }

    /**
     * @param  array<string, mixed>  $preview
     * @return array<string, mixed>
     */
    public static function withDownloadUrls(array $preview, JobApplication $application, string $routePrefix): array
    {
        $preview['highest_degree_url'] = ($preview['has_highest_degree'] ?? false)
            ? route("{$routePrefix}.applications.highest-degree", $application)
            : null;

        $preview['other_document_url'] = ($preview['has_other_document'] ?? false)
            ? route("{$routePrefix}.applications.other-document", $application)
            : null;

        $preview['cover_letter_file_url'] = ($preview['has_cover_letter_file'] ?? false)
            ? route("{$routePrefix}.applications.cover-letter", $application)
            : null;

        $preview['certifications'] = collect($preview['certifications'] ?? [])
            ->values()
            ->map(function (array $certification, int $index) use ($application, $routePrefix): array {
                $attachments = collect($certification['attachments'] ?? [])
                    ->values()
                    ->map(function (array $file, int $attachmentIndex) use ($application, $routePrefix, $index): array {
                        return [
                            'file_name' => $file['file_name'] ?? 'certificate',
                            'download_url' => ($file['available'] ?? false)
                                ? route("{$routePrefix}.applications.certifications", [
                                    'application' => $application,
                                    'index' => $index,
                                    'attachment' => $attachmentIndex,
                                ])
                                : null,
                        ];
                    })
                    ->all();

                return [
                    ...$certification,
                    'attachments' => $attachments,
                ];
            })
            ->all();

        return $preview;
    }

    /**
     * @return list<array{file_path: string, file_name: string}>
     */
    public static function normalizeAttachments(array $entry): array
    {
        if (isset($entry['attachments']) && is_array($entry['attachments'])) {
            return collect($entry['attachments'])
                ->filter(fn(mixed $file): bool => is_array($file) && filled($file['file_path'] ?? null))
                ->map(fn(array $file): array => [
                    'file_path' => (string) $file['file_path'],
                    'file_name' => filled($file['file_name'] ?? null)
                        ? (string) $file['file_name']
                        : basename((string) $file['file_path']),
                ])
                ->values()
                ->all();
        }

        if (filled($entry['file_path'] ?? null)) {
            return [[
                'file_path' => (string) $entry['file_path'],
                'file_name' => filled($entry['file_name'] ?? null)
                    ? (string) $entry['file_name']
                    : basename((string) $entry['file_path']),
            ]];
        }

        return [];
    }
}
