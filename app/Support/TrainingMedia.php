<?php

namespace App\Support;

use App\Models\PlatformSetting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class TrainingMedia
{
    public const SETTING_KEY = 'training';

    public const DISK = 'public';

    public const DIRECTORY = 'training';

    /**
     * @return array{hero_video_path: string|null}
     */
    public static function settings(): array
    {
        $stored = PlatformSetting::query()
            ->where('key', self::SETTING_KEY)
            ->value('value');

        return [
            'hero_video_path' => is_array($stored)
                ? ($stored['hero_video_path'] ?? null)
                : null,
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

    public static function storeHeroVideo(UploadedFile $video): string
    {
        self::deleteHeroVideoFile();

        $path = $video->store(self::DIRECTORY, self::DISK);

        PlatformSetting::query()->updateOrCreate(
            ['key' => self::SETTING_KEY],
            [
                'value' => [
                    'hero_video_path' => $path,
                ],
            ],
        );

        return $path;
    }

    public static function clearHeroVideo(): void
    {
        self::deleteHeroVideoFile();

        PlatformSetting::query()->updateOrCreate(
            ['key' => self::SETTING_KEY],
            [
                'value' => [
                    'hero_video_path' => null,
                ],
            ],
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
