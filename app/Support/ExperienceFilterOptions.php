<?php

namespace App\Support;

use App\Models\JobApplication;
use App\Models\PlatformSetting;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class ExperienceFilterOptions
{
    /**
     * @return list<array{key: string, label: string, min: int|null, max: int|null, enabled: bool}>
     */
    public static function defaults(): array
    {
        return [
            ['key' => '0-2', 'label' => '0-2 years', 'min' => 0, 'max' => 2, 'enabled' => true],
            ['key' => '3-5', 'label' => '3-5 years', 'min' => 3, 'max' => 5, 'enabled' => true],
            ['key' => '6-10', 'label' => '6-10 years', 'min' => 6, 'max' => 10, 'enabled' => true],
            ['key' => '10+', 'label' => '10+ years', 'min' => 10, 'max' => null, 'enabled' => true],
        ];
    }

    /**
     * @return list<array{key: string, label: string, min: int|null, max: int|null, enabled: bool}>
     */
    public static function all(): array
    {
        $stored = PlatformSetting::query()->where('key', 'experience_filters')->value('value');

        if (! is_array($stored) || $stored === []) {
            return self::defaults();
        }

        $ranges = is_array($stored['ranges'] ?? null) ? $stored['ranges'] : $stored;

        $normalized = self::normalizeForStorage(
            collect($ranges)->filter(fn(mixed $range): bool => is_array($range))->all()
        );

        return $normalized !== [] ? $normalized : self::defaults();
    }

    /**
     * @return list<array{key: string, label: string, min: int|null, max: int|null}>
     */
    public static function enabled(): array
    {
        return collect(self::all())
            ->filter(fn(array $range): bool => $range['enabled'] === true)
            ->map(fn(array $range): array => [
                'key' => $range['key'],
                'label' => $range['label'],
                'min' => $range['min'],
                'max' => $range['max'],
            ])
            ->values()
            ->all();
    }

    /**
     * @return array{key: string, label: string, min: int|null, max: int|null}|null
     */
    public static function findEnabled(string $key): ?array
    {
        if ($key === '') {
            return null;
        }

        foreach (self::enabled() as $range) {
            if ($range['key'] === $key) {
                return $range;
            }
        }

        return null;
    }

    /**
     * @param  Builder<JobApplication>  $query
     */
    public static function applyRange(Builder $query, string $key): void
    {
        $range = self::findEnabled($key);

        if ($range === null) {
            return;
        }

        $cast = self::yearsCastExpression('experience_years');

        $query->whereHas('jobSeeker.jobSeekerProfile', function (Builder $profileQuery) use ($range, $cast): void {
            $profileQuery->whereNotNull('experience_years')
                ->where('experience_years', '!=', '');

            if ($range['min'] !== null) {
                $profileQuery->whereRaw("{$cast} >= ?", [$range['min']]);
            }

            if ($range['max'] !== null) {
                $profileQuery->whereRaw("{$cast} <= ?", [$range['max']]);
            }
        });
    }

    /**
     * @param  Builder<JobApplication>  $query
     */
    public static function applySort(Builder $query, string $direction): void
    {
        $direction = $direction === 'asc' ? 'asc' : 'desc';
        $cast = self::yearsCastExpression('job_seeker_profiles.experience_years');

        $query->orderByRaw(
            "(SELECT {$cast}
              FROM job_seeker_profiles
              WHERE job_seeker_profiles.user_id = job_applications.job_seeker_id
              LIMIT 1) {$direction}"
        );
    }

    private static function yearsCastExpression(string $column): string
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'sqlite') {
            return "CAST({$column} AS INTEGER)";
        }

        return "CAST({$column} AS UNSIGNED)";
    }

    /**
     * @param  list<array{key?: mixed, label?: mixed, min?: mixed, max?: mixed, enabled?: mixed}>  $ranges
     * @return list<array{key: string, label: string, min: int|null, max: int|null, enabled: bool}>
     */
    public static function normalizeForStorage(array $ranges): array
    {
        return collect($ranges)
            ->filter(fn(mixed $range): bool => is_array($range) && filled($range['key'] ?? null))
            ->map(function (array $range): array {
                return [
                    'key' => (string) $range['key'],
                    'label' => filled($range['label'] ?? null)
                        ? (string) $range['label']
                        : (string) $range['key'],
                    'min' => isset($range['min']) && $range['min'] !== '' && $range['min'] !== null
                        ? (int) $range['min']
                        : null,
                    'max' => isset($range['max']) && $range['max'] !== '' && $range['max'] !== null
                        ? (int) $range['max']
                        : null,
                    'enabled' => filter_var($range['enabled'] ?? true, FILTER_VALIDATE_BOOLEAN),
                ];
            })
            ->values()
            ->all();
    }
}
