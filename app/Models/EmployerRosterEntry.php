<?php

namespace App\Models;

use Database\Factories\EmployerRosterEntryFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployerRosterEntry extends Model
{
    /** @use HasFactory<EmployerRosterEntryFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'employer_owner_id',
        'job_seeker_id',
        'job_application_id',
        'category',
        'comments',
        'added_by',
    ];

    /**
     * @return BelongsTo<User, $this>
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employer_owner_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function jobSeeker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'job_seeker_id');
    }

    /**
     * @return BelongsTo<JobApplication, $this>
     */
    public function jobApplication(): BelongsTo
    {
        return $this->belongsTo(JobApplication::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function addedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'added_by');
    }

    /**
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeForAccount(Builder $query, int $employerOwnerId): Builder
    {
        return $query->where('employer_owner_id', $employerOwnerId);
    }

    /**
     * @return list<string>
     */
    public static function categoriesForAccount(int $employerOwnerId, ?int $addedBy = null): array
    {
        return static::query()
            ->forAccount($employerOwnerId)
            ->when(
                $addedBy !== null,
                fn (Builder $query) => $query->where('added_by', $addedBy),
            )
            ->whereNotNull('category')
            ->where('category', '!=', '')
            ->distinct()
            ->orderBy('category')
            ->pluck('category')
            ->values()
            ->all();
    }
}
