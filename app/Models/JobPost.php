<?php

namespace App\Models;

use App\Enums\JobPostStatus;
use App\Support\JobAlertMatcher;
use Database\Factories\JobPostFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
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
        'country',
        'location',
        'employment_type',
        'experience_level',
        'salary_range',
        'career_portal_url',
        'apply_by_link',
        'hide_on_site_apply',
        'employer_can_manage_apply',
        'description',
        'requirements',
        'skills',
        'application_questions',
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
            'apply_by_link' => 'boolean',
            'hide_on_site_apply' => 'boolean',
            'employer_can_manage_apply' => 'boolean',
            'views' => 'integer',
            'skills' => 'array',
            'application_questions' => 'array',
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

        static::saved(function (JobPost $job): void {
            if (! $job->wasChanged('status') || $job->status !== JobPostStatus::Active) {
                return;
            }

            JobAlertMatcher::notifyFor($job);
        });
    }

    public function hasLogo(): bool
    {
        return filled($this->logo_path);
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

    public function closingDateLabel(): ?string
    {
        if ($this->expires_at === null) {
            return null;
        }

        $month = $this->expires_at->format('M');

        if ($month === 'Sep') {
            $month = 'Sept';
        }

        return $this->expires_at->format('j').' '.$month.' '.$this->expires_at->format('Y');
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
     * @return BelongsToMany<User, $this>
     */
    public function panelMembers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'job_post_panel_members')
            ->withPivot(['assigned_by'])
            ->withTimestamps();
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
