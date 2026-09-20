<?php

namespace App\Support;

use App\Models\PlatformSetting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TrainingMedia
{
    public const SETTING_KEY = 'training';

    public const DISK = 'public';

    public const DIRECTORY = 'training';

    public const DOCUMENTS_DIRECTORY = 'training/documents';

    /**
     * @return array{hero_video_path: string|null, documents: list<array{id: string, name: string, file_name: string, path: string, mime: string|null, size: int|null}>}
     */
    public static function settings(): array
    {
        $stored = PlatformSetting::query()
            ->where('key', self::SETTING_KEY)
            ->value('value');

        $documents = [];

        if (is_array($stored) && isset($stored['documents']) && is_array($stored['documents'])) {
            foreach ($stored['documents'] as $document) {
                if (! is_array($document) || ! filled($document['path'] ?? null)) {
                    continue;
                }

                $documents[] = [
                    'id' => (string) ($document['id'] ?? Str::uuid()),
                    'name' => (string) ($document['name'] ?? $document['file_name'] ?? 'Document'),
                    'file_name' => (string) ($document['file_name'] ?? basename((string) $document['path'])),
                    'path' => (string) $document['path'],
                    'mime' => isset($document['mime']) ? (string) $document['mime'] : null,
                    'size' => isset($document['size']) ? (int) $document['size'] : null,
                ];
            }
        }

        return [
            'hero_video_path' => is_array($stored)
                ? ($stored['hero_video_path'] ?? null)
                : null,
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
        $path = self::heroVideoPath();

        if ($path === null || ! Storage::disk(self::DISK)->exists($path)) {
            return null;
        }

        return '/storage/'.$path;
    }

    /**
     * @return list<array{id: string, name: string, file_name: string, url: string, mime: string|null, size: int|null}>
     */
    public static function documents(): array
    {
        $items = [];

        foreach (self::settings()['documents'] as $document) {
            if (! Storage::disk(self::DISK)->exists($document['path'])) {
                continue;
            }

            $items[] = [
                'id' => $document['id'],
                'name' => $document['name'],
                'file_name' => $document['file_name'],
                'url' => '/storage/'.$document['path'],
                'mime' => $document['mime'],
                'size' => $document['size'],
            ];
        }

        return $items;
    }

    public static function storeHeroVideo(UploadedFile $video): string
    {
        self::deleteHeroVideoFile();

        $path = $video->store(self::DIRECTORY, self::DISK);
        $settings = self::settings();

        self::persist([
            'hero_video_path' => $path,
            'documents' => $settings['documents'],
        ]);

        return $path;
    }

    public static function clearHeroVideo(): void
    {
        self::deleteHeroVideoFile();

        $settings = self::settings();

        self::persist([
            'hero_video_path' => null,
            'documents' => $settings['documents'],
        ]);
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
            'hero_video_path' => $settings['hero_video_path'],
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
            'hero_video_path' => $settings['hero_video_path'],
            'documents' => $remaining,
        ]);

        return true;
    }

    /**
     * @param  array{hero_video_path: string|null, documents: list<array{id: string, name: string, file_name: string, path: string, mime: string|null, size: int|null}>}  $value
     */
    private static function persist(array $value): void
    {
        PlatformSetting::query()->updateOrCreate(
            ['key' => self::SETTING_KEY],
            ['value' => $value],
        );
    }

    private static function deleteHeroVideoFile(): void
    {
        $path = self::heroVideoPath();

        if ($path !== null) {
            Storage::disk(self::DISK)->delete($path);
        }
    }
}
