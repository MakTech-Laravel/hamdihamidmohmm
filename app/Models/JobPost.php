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
        'slug',
        'category',
        'location',
        'employment_type',
        'salary_range',
        'description',
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
                    ->orWhere('expires_at', '>', now());
            });
    }

    public function effectiveStatus(): JobPostStatus
    {
        if ($this->status === JobPostStatus::Active && $this->expires_at !== null && $this->expires_at->isPast()) {
            return JobPostStatus::Expired;
        }

        return $this->status ?? JobPostStatus::Pending;
    }

    public function incrementViews(): void
    {
        $this->increment('views');
    }
}
