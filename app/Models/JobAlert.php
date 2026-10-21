<?php

namespace App\Models;

use Database\Factories\JobAlertFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class JobAlert extends Model
{
    /** @use HasFactory<JobAlertFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'name',
        'keyword',
        'country',
        'location',
        'category',
        'employment_type',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsToMany<JobPost, $this>
     */
    public function matchedJobs(): BelongsToMany
    {
        return $this->belongsToMany(JobPost::class, 'job_alert_matches')
            ->withTimestamps();
    }

    public function displayName(): string
    {
        if (filled($this->name)) {
            return (string) $this->name;
        }

        if (filled($this->keyword)) {
            return (string) $this->keyword;
        }

        return collect([
            $this->category,
            $this->location,
            $this->country,
            $this->employment_type,
        ])->filter()->implode(' · ') ?: 'Job alert';
    }
}
