<?php

namespace App\Support;

use App\Enums\JobTaxonomyType;
use App\Models\JobPost;
use App\Models\JobTaxonomy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class JobListingQuery
{
    /**
     * @return list<string>
     */
    public static function categoryOptions(): array
    {
        return collect(JobTaxonomy::optionsFor(JobTaxonomyType::PositionArea))
            ->pluck('label')
            ->values()
            ->all();
    }

    /**
     * @return list<string>
     */
    public static function employmentTypeKeys(): array
    {
        return collect(JobTaxonomy::optionsFor(JobTaxonomyType::EmploymentType))
            ->pluck('value')
            ->values()
            ->all();
    }

    public static function normalizeToken(?string $value): string
    {
        return Str::lower((string) preg_replace('/[^a-z0-9]+/i', '', (string) $value));
    }

    /**
     * @param  Builder<JobPost>  $query
     * @param  list<string>|Collection<int, string>  $types
     * @return Builder<JobPost>
     */
    public static function apply(
        Builder $query,
        string $search = '',
        string $location = '',
        string $category = '',
        array|Collection $types = [],
        string $country = '',
    ): Builder {
        $types = collect($types)
            ->map(fn (mixed $type): string => trim((string) $type))
            ->filter()
            ->values();

        return $query
            ->when($search !== '', function (Builder $builder) use ($search): void {
                $builder->where(function (Builder $inner) use ($search): void {
                    $inner->where('title', 'like', "%{$search}%")
                        ->orWhere('category', 'like', "%{$search}%")
                        ->orWhere('location', 'like', "%{$search}%")
                        ->orWhere('country', 'like', "%{$search}%")
                        ->orWhereHas('employer', function (Builder $employer) use ($search): void {
                            $employer->where('company_name', 'like', "%{$search}%")
                                ->orWhere('name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($country !== '', function (Builder $builder) use ($country): void {
                self::applyTaxonomyFilter($builder, 'country', JobTaxonomyType::Country, $country);
            })
            ->when($location !== '', function (Builder $builder) use ($location): void {
                self::applyTaxonomyFilter($builder, 'location', JobTaxonomyType::DutyStation, $location);
            })
            ->when($category !== '' && $category !== 'all', function (Builder $builder) use ($category): void {
                self::applyTaxonomyFilter($builder, 'category', JobTaxonomyType::PositionArea, $category);
            })
            ->when($types->isNotEmpty(), function (Builder $builder) use ($types): void {
                $builder->where(function (Builder $inner) use ($types): void {
                    foreach ($types as $type) {
                        $normalized = self::normalizeToken($type);

                        foreach (self::employmentTypeVariants($type) as $variant) {
                            $inner->orWhere('employment_type', $variant);
                        }

                        if ($normalized !== '') {
                            $inner->orWhereRaw(
                                "LOWER(REPLACE(REPLACE(REPLACE(COALESCE(employment_type, ''), '-', ''), '_', ''), ' ', '')) = ?",
                                [$normalized],
                            );
                        }
                    }
                });
            });
    }

    /**
     * @param  Builder<JobPost>  $builder
     */
    private static function applyTaxonomyFilter(
        Builder $builder,
        string $column,
        JobTaxonomyType $type,
        string $value,
    ): void {
        $value = trim($value);
        $taxonomy = JobTaxonomy::query()
            ->ofType($type)
            ->where(function (Builder $query) use ($value): void {
                $query->where('slug', $value)
                    ->orWhere('name', $value);
            })
            ->first();

        $builder->where(function (Builder $inner) use ($column, $value, $taxonomy): void {
            $inner->where($column, $value);

            if ($taxonomy !== null) {
                $inner->orWhere($column, $taxonomy->slug)
                    ->orWhere($column, $taxonomy->name)
                    ->orWhere($column, 'like', '%'.$taxonomy->name.'%');
            } else {
                $inner->orWhere($column, 'like', "%{$value}%");
            }
        });
    }

    /**
     * @return list<string>
     */
    public static function employmentTypeVariants(string $type): array
    {
        $normalized = self::normalizeToken($type);

        return match ($normalized) {
            'fulltime' => ['Full-time', 'Full Time', 'full-time', 'full_time', 'Fulltime'],
            'parttime' => ['Part-time', 'Part Time', 'part-time', 'part_time', 'Parttime'],
            'contract' => ['Contract', 'contract'],
            'freelance' => ['Freelance', 'freelance'],
            'internship', 'intern' => ['Internship', 'Intern', 'internship'],
            'remote' => ['Remote', 'remote'],
            default => array_values(array_unique(array_filter([
                $type,
                Str::title(str_replace('_', ' ', $type)),
                str_replace('_', '-', $type),
                str_replace('_', ' ', $type),
            ]))),
        };
    }

    /**
     * Whether a stored employment type matches one of the selected filter keys/values.
     *
     * @param  list<string>  $selectedTypes
     */
    public static function employmentTypeMatches(?string $storedType, array $selectedTypes): bool
    {
        if ($selectedTypes === []) {
            return true;
        }

        $stored = self::normalizeToken($storedType);

        if ($stored === '') {
            return false;
        }

        foreach ($selectedTypes as $selected) {
            if ($stored === self::normalizeToken($selected)) {
                return true;
            }

            foreach (self::employmentTypeVariants($selected) as $variant) {
                if ($stored === self::normalizeToken($variant)) {
                    return true;
                }
            }
        }

        return false;
    }

    public static function displayLabel(JobTaxonomyType $type, ?string $stored): string
    {
        return JobTaxonomy::labelFor($type, $stored) ?? (string) $stored;
    }
}
