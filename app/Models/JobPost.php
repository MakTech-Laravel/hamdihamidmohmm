<?php

namespace App\Models;

use App\Enums\JobPostStatus;
use Database\Factories\JobPostFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class JobPost extends Model
{
    /** @use HasFactory<JobPostFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'employer_id',
        'title',
        'subtitle',
        'logo_path',
        'slug',
        'category',
        'location',
        'employment_type',
        'experience_level',
        'salary_range',
        'description',
        'requirements',
        'skills',
        'status',
        'featured',
        'views',
        'expires_at',
        'rejection_reason',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => JobPostStatus::class,
            'featured' => 'boolean',
            'views' => 'integer',
            'skills' => 'array',
            'expires_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (JobPost $job): void {
            if (blank($job->slug)) {
                $job->slug = Str::slug($job->title).'-'.Str::lower(Str::random(6));
            }
        });

        static::deleting(function (JobPost $job): void {
            $job->deleteLogoFile();
        });
    }

    public function hasLogo(): bool
    {
        return filled($this->logo_path)
            && Storage::disk('public')->exists((string) $this->logo_path);
    }

    public function logoUrl(): ?string
    {
        if (! $this->hasLogo()) {
            return null;
        }

        return '/storage/'.$this->logo_path;
    }

    public function listingLogoUrl(): ?string
    {
        if ($this->hasLogo()) {
            return $this->logoUrl();
        }

        if ($this->employer?->hasCompanyLogo()) {
            return $this->employer->companyLogoUrl();
        }

        return null;
    }

    public function deleteLogoFile(): void
    {
        if (filled($this->logo_path)) {
            Storage::disk('public')->delete((string) $this->logo_path);
        }
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function employer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employer_id');
    }

    /**
     * @return HasMany<JobApplication, $this>
     */
    public function applications(): HasMany
    {
        return $this->hasMany(JobApplication::class);
    }

    /**
     * @return HasOne<JobApplication, $this>
     */
    public function latestApplication(): HasOne
    {
        return $this->hasOne(JobApplication::class)->latestOfMany();
    }

    /**
     * @param  Builder<JobPost>  $query
     * @return Builder<JobPost>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', JobPostStatus::Active)
            ->where(function (Builder $builder): void {
                $builder->whereNull('expires_at')
                    ->orWhere('expires_at', '>=', now()->startOfDay());
            });
    }

    public function effectiveStatus(): JobPostStatus
    {
        if ($this->status === JobPostStatus::Active && $this->listingHasEnded()) {
            return JobPostStatus::Expired;
        }

        return $this->status ?? JobPostStatus::Pending;
    }

    public function activateFromReview(int $listingDays = 30): void
    {
        $expiresAt = $this->expires_at;

        if ($expiresAt === null || ! $expiresAt->isFuture()) {
            $expiresAt = now()->addDays($listingDays);
        }

        $this->forceFill([
            'status' => JobPostStatus::Active,
            'rejection_reason' => null,
            'expires_at' => $expiresAt,
        ])->save();
    }

    public function listingHasEnded(): bool
    {
        if ($this->expires_at === null) {
            return false;
        }

        return $this->expires_at->copy()->endOfDay()->isPast();
    }

    public function incrementViews(): void
    {
        $this->increment('views');
    }
}
