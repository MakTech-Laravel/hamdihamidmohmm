<?php

namespace App\Models;

use Database\Factories\JobSeekerProfileFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobSeekerProfile extends Model
{
    /** @use HasFactory<JobSeekerProfileFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'headline',
        'bio',
        'skills',
        'education',
        'experience',
        'languages',
        'certifications',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'skills' => 'array',
            'education' => 'array',
            'experience' => 'array',
            'languages' => 'array',
            'certifications' => 'array',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function completionPercent(): int
    {
        $checks = [
            filled($this->headline),
            filled($this->bio),
            is_array($this->skills) && $this->skills !== [],
            is_array($this->education) && $this->education !== [],
            is_array($this->experience) && $this->experience !== [],
            is_array($this->languages) && $this->languages !== [],
            is_array($this->certifications) && $this->certifications !== [],
        ];

        $done = count(array_filter($checks));

        return (int) round(($done / count($checks)) * 100);
    }
}
