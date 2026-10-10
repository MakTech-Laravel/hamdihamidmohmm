<?php

namespace App\Support;

use App\Models\PlatformSetting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class TrainingMedia
{
    public const SETTING_KEY = 'training';

    public const DISK = 'public';

    public const DIRECTORY = 'training';

    public const VIDEOS_DIRECTORY = 'training/videos';

    public const DOCUMENTS_DIRECTORY = 'training/documents';

    public const MAX_VIDEOS = 12;

    /**
     * @return array{
     *     hero_video_path: string|null,
     *     videos: list<array{id: string, name: string, file_name: string, path: string, mime: string|null, size: int|null}>,
     *     documents: list<array{id: string, name: string, file_name: string, path: string, mime: string|null, size: int|null}>
     * }
     */
    public static function settings(): array
    {
        $stored = PlatformSetting::query()
            ->where('key', self::SETTING_KEY)
            ->value('value');

        $documents = self::normalizeMediaList(
            is_array($stored) && isset($stored['documents']) && is_array($stored['documents'])
                ? $stored['documents']
                : [],
        );

        $videos = self::normalizeMediaList(
            is_array($stored) && isset($stored['videos']) && is_array($stored['videos'])
                ? $stored['videos']
                : [],
        );

        if ($videos === [] && is_array($stored) && filled($stored['hero_video_path'] ?? null)) {
            $path = (string) $stored['hero_video_path'];
            $videos[] = [
                'id' => 'legacy-hero',
                'name' => 'Training video',
                'file_name' => basename($path),
                'path' => $path,
                'mime' => null,
                'size' => null,
            ];
        }

        return [
            'hero_video_path' => $videos[0]['path'] ?? null,
            'videos' => $videos,
            'documents' => $documents,
        ];
    }

    public static function heroVideoPath(): ?string
    {
        $path = self::settings()['hero_video_path'] ?? null;

        return filled($path) ? (string) $path : null;
    }

    public static function heroVideoUrl(): ?string
    {
        $videos = self::videos();

        return $videos[0]['url'] ?? null;
    }

    /**
     * @return list<array{id: string, name: string, file_name: string, url: string, mime: string|null, size: int|null}>
     */
    public static function videos(): array
    {
        return self::publicMedia(self::settings()['videos'], 'video');
    }

    /**
     * @return array{id: string, name: string, file_name: string, path: string, mime: string|null, size: int|null}|null
     */
    public static function storedVideo(string $id): ?array
    {
        foreach (self::settings()['videos'] as $video) {
            if ($video['id'] === $id) {
                return $video;
            }
        }

        return null;
    }

    public static function streamUrl(string $id): string
    {
        return route('training.videos.show', $id, false);
    }

    public static function absolutePath(string $id): ?string
    {
        $video = self::storedVideo($id);

        if ($video === null || ! Storage::disk(self::DISK)->exists($video['path'])) {
            return null;
        }

        return Storage::disk(self::DISK)->path($video['path']);
    }

    /**
     * @return list<array{id: string, name: string, file_name: string, url: string, mime: string|null, size: int|null}>
     */
    public static function documents(): array
    {
        return self::publicMedia(self::settings()['documents']);
    }

    /**
     * @return array{id: string, name: string, file_name: string, path: string, mime: string|null, size: int|null}
     */
    public static function storeHeroVideo(UploadedFile $video, ?string $name = null): array
    {
        return self::storeVideo($video, $name);
    }

    /**
     * @return array{id: string, name: string, file_name: string, path: string, mime: string|null, size: int|null}
     */
    public static function storeVideo(UploadedFile $video, ?string $name = null): array
    {
        $settings = self::settings();

        if (count($settings['videos']) >= self::MAX_VIDEOS) {
            throw ValidationException::withMessages([
                'video' => 'You can upload a maximum of ' . self::MAX_VIDEOS . ' training videos.',
                'videos' => 'You can upload a maximum of ' . self::MAX_VIDEOS . ' training videos.',
            ]);
        }

        $path = $video->store(self::VIDEOS_DIRECTORY, self::DISK);

        $item = [
            'id' => (string) Str::uuid(),
            'name' => filled($name)
                ? trim((string) $name)
                : pathinfo($video->getClientOriginalName(), PATHINFO_FILENAME),
            'file_name' => $video->getClientOriginalName(),
            'path' => $path,
            'mime' => $video->getClientMimeType(),
            'size' => $video->getSize() ?: null,
        ];

        $videos = $settings['videos'];
        $videos[] = $item;

        self::persist([
            'videos' => $videos,
            'documents' => $settings['documents'],
        ]);

        return $item;
    }

    public static function deleteVideo(string $id): bool
    {
        $settings = self::settings();
        $removed = false;
        $remaining = [];

        foreach ($settings['videos'] as $video) {
            if ($video['id'] === $id) {
                Storage::disk(self::DISK)->delete($video['path']);
                $removed = true;

                continue;
            }

            $remaining[] = $video;
        }

        if (! $removed) {
            return false;
        }

        self::persist([
            'videos' => $remaining,
            'documents' => $settings['documents'],
        ]);

        return true;
    }

    public static function clearHeroVideo(): void
    {
        $settings = self::settings();
        $first = $settings['videos'][0] ?? null;

        if ($first === null) {
            return;
        }

        self::deleteVideo($first['id']);
    }

    /**
     * @return array{id: string, name: string, file_name: string, path: string, mime: string|null, size: int|null}
     */
    public static function storeDocument(UploadedFile $file, ?string $name = null): array
    {
        $path = $file->store(self::DOCUMENTS_DIRECTORY, self::DISK);
        $settings = self::settings();

        $document = [
            'id' => (string) Str::uuid(),
            'name' => filled($name) ? trim((string) $name) : pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
            'file_name' => $file->getClientOriginalName(),
            'path' => $path,
            'mime' => $file->getClientMimeType(),
            'size' => $file->getSize() ?: null,
        ];

        $documents = $settings['documents'];
        $documents[] = $document;

        self::persist([
            'videos' => $settings['videos'],
            'documents' => $documents,
        ]);

        return $document;
    }

    public static function deleteDocument(string $id): bool
    {
        $settings = self::settings();
        $documents = $settings['documents'];
        $removed = false;

        $remaining = [];

        foreach ($documents as $document) {
            if ($document['id'] === $id) {
                Storage::disk(self::DISK)->delete($document['path']);
                $removed = true;

                continue;
            }

            $remaining[] = $document;
        }

        if (! $removed) {
            return false;
        }

        self::persist([
            'videos' => $settings['videos'],
            'documents' => $remaining,
        ]);

        return true;
    }

    /**
     * @param  array{videos: list<array{id: string, name: string, file_name: string, path: string, mime: string|null, size: int|null}>, documents: list<array{id: string, name: string, file_name: string, path: string, mime: string|null, size: int|null}>}  $value
     */
    private static function persist(array $value): void
    {
        PlatformSetting::query()->updateOrCreate(
            ['key' => self::SETTING_KEY],
            [
                'value' => [
                    'hero_video_path' => $value['videos'][0]['path'] ?? null,
                    'videos' => $value['videos'],
                    'documents' => $value['documents'],
                ],
            ],
        );
    }

    /**
     * @param  list<mixed>  $items
     * @return list<array{id: string, name: string, file_name: string, path: string, mime: string|null, size: int|null}>
     */
    private static function normalizeMediaList(array $items): array
    {
        $normalized = [];

        foreach ($items as $item) {
            if (! is_array($item) || ! filled($item['path'] ?? null)) {
                continue;
            }

            $normalized[] = [
                'id' => (string) ($item['id'] ?? Str::uuid()),
                'name' => (string) ($item['name'] ?? $item['file_name'] ?? 'Media'),
                'file_name' => (string) ($item['file_name'] ?? basename((string) $item['path'])),
                'path' => (string) $item['path'],
                'mime' => isset($item['mime']) ? (string) $item['mime'] : null,
                'size' => isset($item['size']) ? (int) $item['size'] : null,
            ];
        }

        return $normalized;
    }

    /**
     * @param  list<array{id: string, name: string, file_name: string, path: string, mime: string|null, size: int|null}>  $items
     * @return list<array{id: string, name: string, file_name: string, url: string, mime: string|null, size: int|null}>
     */
    private static function publicMedia(array $items, string $kind = 'file'): array
    {
        $public = [];

        foreach ($items as $item) {
            if (! Storage::disk(self::DISK)->exists($item['path'])) {
                continue;
            }

            $public[] = [
                'id' => $item['id'],
                'name' => $item['name'],
                'file_name' => $item['file_name'],
                'url' => $kind === 'video'
                    ? self::streamUrl($item['id'])
                    : '/storage/' . $item['path'],
                'mime' => $item['mime'],
                'size' => $item['size'],
            ];
        }

        return $public;
    }
}
