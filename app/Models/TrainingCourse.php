<?php

namespace App\Models;

use App\Enums\TrainingRegistrationStatus;
use Carbon\CarbonInterface;
use Database\Factories\TrainingCourseFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class TrainingCourse extends Model
{
    /** @use HasFactory<TrainingCourseFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'title',
        'slug',
        'description',
        'starts_on',
        'ends_on',
        'duration',
        'location',
        'trainer',
        'seats',
        'registration_deadline',
        'is_published',
        'questions',
        'thumbnail_path',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'starts_on' => 'date',
            'ends_on' => 'date',
            'registration_deadline' => 'date',
            'is_published' => 'boolean',
            'seats' => 'integer',
            'questions' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (TrainingCourse $course): void {
            if (blank($course->slug)) {
                $course->slug = static::uniqueSlug($course->title);
            }
        });
    }

    /**
     * @param  Builder<TrainingCourse>  $query
     * @return Builder<TrainingCourse>
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }

    /**
     * @param  Builder<TrainingCourse>  $query
     * @return Builder<TrainingCourse>
     */
    public function scopeWithOccupiedSeats(Builder $query): Builder
    {
        return $query->withCount([
            'registrations as occupied_seats_count' => function (Builder $registrations): void {
                $registrations->whereIn('status', TrainingRegistrationStatus::occupyingValues());
            },
        ]);
    }

    /**
     * @return HasMany<TrainingRegistration, $this>
     */
    public function registrations(): HasMany
    {
        return $this->hasMany(TrainingRegistration::class);
    }

    public function occupiedSeats(): int
    {
        if (array_key_exists('occupied_seats_count', $this->attributes)) {
            return (int) $this->occupied_seats_count;
        }

        return $this->registrations()
            ->whereIn('status', TrainingRegistrationStatus::occupyingValues())
            ->count();
    }

    public function thumbnailUrl(): ?string
    {
        if (blank($this->thumbnail_path)) {
            return null;
        }

        return '/storage/'.$this->thumbnail_path;
    }

    public function availableSeats(): int
    {
        return max(0, $this->seats - $this->occupiedSeats());
    }

    public function registrationIsOpen(): bool
    {
        return $this->is_published
            && ! $this->registrationDeadlinePassed()
            && $this->availableSeats() > 0;
    }

    public function registrationDeadlinePassed(): bool
    {
        $deadline = $this->registration_deadline;

        if (! $deadline instanceof CarbonInterface) {
            return true;
        }

        return $deadline->copy()->endOfDay()->isPast();
    }

    /**
     * @return list<array{id: string, label: string, type: string, required: bool, options: list<string>}>
     */
    public function normalizedQuestions(): array
    {
        return collect($this->questions ?? [])
            ->filter(fn (mixed $question): bool => is_array($question))
            ->map(function (array $question): array {
                $options = collect($question['options'] ?? [])
                    ->filter(fn (mixed $option): bool => is_string($option) && trim($option) !== '')
                    ->map(fn (string $option): string => trim($option))
                    ->values()
                    ->all();

                return [
                    'id' => (string) ($question['id'] ?? ''),
                    'label' => (string) ($question['label'] ?? ''),
                    'type' => (string) ($question['type'] ?? ''),
                    'required' => (bool) ($question['required'] ?? false),
                    'options' => $options,
                ];
            })
            ->filter(fn (array $question): bool => $question['id'] !== '' && $question['label'] !== '')
            ->values()
            ->all();
    }

    public static function uniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($title);
        $base = $base !== '' ? $base : 'course';
        $slug = $base;
        $suffix = 2;

        while (
            static::query()
                ->when($ignoreId !== null, fn (Builder $query) => $query->whereKeyNot($ignoreId))
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }
}
