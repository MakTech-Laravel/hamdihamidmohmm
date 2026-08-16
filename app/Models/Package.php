<?php

namespace App\Models;

use App\Enums\EmployerPackage;
use Database\Factories\PackageFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Package extends Model
{
    /** @use HasFactory<PackageFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'slug',
        'name',
        'description',
        'price',
        'currency',
        'billing_period',
        'job_credits',
        'featured_credits',
        'features',
        'excluded_features',
        'is_active',
        'is_featured',
        'is_public',
        'sort_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'job_credits' => 'integer',
            'featured_credits' => 'integer',
            'features' => 'array',
            'excluded_features' => 'array',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'is_public' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function enum(): ?EmployerPackage
    {
        return EmployerPackage::tryFrom($this->slug);
    }

    /**
     * @param  Builder<Package>  $query
     * @return Builder<Package>
     */
    public function scopePublicActive(Builder $query): Builder
    {
        return $query->where('is_active', true)
            ->where('is_public', true)
            ->orderBy('sort_order')
            ->orderBy('price');
    }

    /**
     * @return list<array{
     *     id: int,
     *     slug: string,
     *     name: string,
     *     description: string|null,
     *     price: int,
     *     currency: string,
     *     is_featured: bool,
     *     features: list<array{key: string, included: bool}>
     * }>
     */
    public static function publicCards(): array
    {
        return static::query()
            ->publicActive()
            ->get()
            ->map(fn (Package $package): array => $package->toPublicCard())
            ->values()
            ->all();
    }

    public static function localizedLabel(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return $value;
        }

        $translated = __($value);

        return is_string($translated) && $translated !== '' ? $translated : $value;
    }

    /**
     * @param  list<mixed>|null  $values
     * @return list<string>
     */
    public static function localizedList(?array $values): array
    {
        return collect($values ?? [])
            ->filter(fn (mixed $value): bool => is_string($value) && $value !== '')
            ->map(fn (string $value): string => (string) static::localizedLabel($value))
            ->values()
            ->all();
    }

    public static function toStorageKey(string $value): string
    {
        $trimmed = trim($value);

        if ($trimmed === '' || str_starts_with($trimmed, 'pricing.')) {
            return $trimmed;
        }

        static $lookup = null;

        if ($lookup === null) {
            $translations = json_decode((string) file_get_contents(lang_path('en.json')), true);
            $lookup = [];

            if (is_array($translations)) {
                foreach ($translations as $key => $label) {
                    if (is_string($key) && is_string($label) && str_starts_with($key, 'pricing.')) {
                        $lookup[$label] = $key;
                    }
                }
            }
        }

        return $lookup[$trimmed] ?? $trimmed;
    }

    /**
     * @return HasMany<Payment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * @return list<array{key: string, included: bool}>
     */
    public function displayFeatures(): array
    {
        $included = collect($this->features ?? [])
            ->filter(fn (mixed $feature): bool => is_string($feature) && $feature !== '')
            ->map(fn (string $feature): array => [
                'key' => $feature,
                'included' => true,
            ]);

        $excluded = collect($this->excluded_features ?? [])
            ->filter(fn (mixed $feature): bool => is_string($feature) && $feature !== '')
            ->map(fn (string $feature): array => [
                'key' => $feature,
                'included' => false,
            ]);

        return $included->concat($excluded)->values()->all();
    }

    /**
     * @return array{
     *     id: int,
     *     slug: string,
     *     name: string,
     *     description: string|null,
     *     price: int,
     *     currency: string,
     *     is_featured: bool,
     *     features: list<array{key: string, included: bool}>
     * }
     */
    public function toPublicCard(): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'description' => $this->description,
            'price' => $this->price,
            'currency' => $this->currency,
            'is_featured' => $this->is_featured,
            'features' => $this->displayFeatures(),
        ];
    }
}
