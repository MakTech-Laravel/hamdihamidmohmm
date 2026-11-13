<?php

namespace App\Models;

use App\Enums\JobTaxonomyType;
use Database\Factories\JobTaxonomyFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class JobTaxonomy extends Model
{
    /** @use HasFactory<JobTaxonomyFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'type',
        'name',
        'slug',
        'is_active',
        'sort_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => JobTaxonomyType::class,
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (JobTaxonomy $taxonomy): void {
            if (blank($taxonomy->slug) && filled($taxonomy->name)) {
                $taxonomy->slug = Str::slug($taxonomy->name);
            }
        });

        static::saved(fn () => self::forgetOptionsCache());
        static::deleted(fn () => self::forgetOptionsCache());
    }

    /**
     * @param  Builder<JobTaxonomy>  $query
     * @return Builder<JobTaxonomy>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * @param  Builder<JobTaxonomy>  $query
     * @return Builder<JobTaxonomy>
     */
    public function scopeOfType(Builder $query, JobTaxonomyType|string $type): Builder
    {
        $value = $type instanceof JobTaxonomyType ? $type->value : $type;

        return $query->where('type', $value);
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function optionsFor(JobTaxonomyType|string $type): array
    {
        $value = $type instanceof JobTaxonomyType ? $type->value : $type;

        /** @var list<array{value: string, label: string}> $options */
        $options = Cache::remember(
            self::optionsCacheKey($value),
            now()->addMinutes(10),
            function () use ($value): array {
                return self::query()
                    ->active()
                    ->ofType($value)
                    ->orderBy('sort_order')
                    ->orderBy('name')
                    ->get(['slug', 'name'])
                    ->map(fn (JobTaxonomy $item): array => [
                        'value' => $item->slug,
                        'label' => $item->name,
                    ])
                    ->values()
                    ->all();
            }
        );

        return $options;
    }

    /**
     * @return array{
     *     countries: list<array{value: string, label: string}>,
     *     dutyStations: list<array{value: string, label: string}>,
     *     positionAreas: list<array{value: string, label: string}>,
     *     employmentTypes: list<array{value: string, label: string}>,
     *     experienceLevels: list<array{value: string, label: string}>,
     *     organizationTypes: list<array{value: string, label: string}>
     * }
     */
    public static function filterOptions(): array
    {
        return [
            'countries' => self::optionsFor(JobTaxonomyType::Country),
            'dutyStations' => self::optionsFor(JobTaxonomyType::DutyStation),
            'positionAreas' => self::optionsFor(JobTaxonomyType::PositionArea),
            'employmentTypes' => self::optionsFor(JobTaxonomyType::EmploymentType),
            'experienceLevels' => self::optionsFor(JobTaxonomyType::ExperienceLevel),
            'organizationTypes' => self::optionsFor(JobTaxonomyType::OrganizationType),
        ];
    }

    /**
     * @return list<array{value: string, label: string, translation_key: string}>
     */
    public static function organizationTypeOptions(?string $current = null): array
    {
        $options = self::withCurrentOption(
            self::optionsFor(JobTaxonomyType::OrganizationType),
            $current,
            JobTaxonomyType::OrganizationType,
        );

        return array_map(
            fn (array $option): array => [
                'value' => $option['value'],
                'label' => $option['label'],
                'translation_key' => 'employer.profile.organization_type.'.$option['value'],
            ],
            $options,
        );
    }

    /**
     * @param  list<array{value: string, label: string}>  $options
     * @return list<array{value: string, label: string}>
     */
    public static function withCurrentOption(
        array $options,
        ?string $current,
        JobTaxonomyType|string|null $type = null,
    ): array {
        if ($current === null || trim($current) === '') {
            return $options;
        }

        $current = trim($current);

        $exists = collect($options)->contains(
            fn (array $option): bool => $option['value'] === $current,
        );

        if ($exists) {
            return $options;
        }

        $label = $type !== null
            ? (self::labelFor($type, $current) ?? $current)
            : $current;

        return [
            ['value' => $current, 'label' => $label.' (current)'],
            ...$options,
        ];
    }

    public static function labelFor(JobTaxonomyType|string $type, ?string $slugOrName): ?string
    {
        if ($slugOrName === null || trim($slugOrName) === '') {
            return null;
        }

        $value = $type instanceof JobTaxonomyType ? $type->value : $type;
        $needle = trim($slugOrName);

        $match = self::query()
            ->ofType($value)
            ->where(function (Builder $query) use ($needle): void {
                $query->where('slug', $needle)
                    ->orWhere('name', $needle);
            })
            ->first();

        return $match?->name ?? $needle;
    }

    public static function isValidSlug(JobTaxonomyType|string $type, ?string $slug, bool $activeOnly = true): bool
    {
        if ($slug === null || trim($slug) === '') {
            return false;
        }

        $value = $type instanceof JobTaxonomyType ? $type->value : $type;

        return self::query()
            ->ofType($value)
            ->when($activeOnly, fn (Builder $query) => $query->active())
            ->where('slug', trim($slug))
            ->exists();
    }

    public static function forgetOptionsCache(): void
    {
        foreach (JobTaxonomyType::cases() as $type) {
            Cache::forget(self::optionsCacheKey($type->value));
        }
    }

    private static function optionsCacheKey(string $type): string
    {
        return "job_taxonomy_options:{$type}";
    }
}
