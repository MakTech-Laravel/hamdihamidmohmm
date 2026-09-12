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
        'current_title',
        'experience_years',
        'bio',
        'linkedin_url',
        'github_url',
        'industry',
        'expected_salary',
        'availability',
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
            'availability' => 'array',
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

    public function experienceYears(): ?int
    {
        if (! is_array($this->experience) || $this->experience === []) {
            return null;
        }

        $years = 0;

        foreach ($this->experience as $item) {
            if (! is_array($item)) {
                continue;
            }

            if (isset($item['years'])) {
                $years += (int) $item['years'];
            }
        }

        return $years > 0 ? $years : null;
    }

    public function experienceLabel(): string
    {
        if (filled($this->experience_years)) {
            $value = trim((string) $this->experience_years);

            if (ctype_digit($value)) {
                $years = (int) $value;

                return $years === 1 ? '1 year' : $years . ' years';
            }

            return $value;
        }

        $years = $this->experienceYears();

        if ($years === null) {
            return '—';
        }

        return $years === 1 ? '1 year' : $years . ' years';
    }

    public function completionPercent(): int
    {
        $user = $this->relationLoaded('user') ? $this->user : $this->user()->first();

        $checks = [
            filled($this->headline),
            filled($this->bio),
            filled($this->current_title) || filled($this->industry) || filled($this->expected_salary),
            is_array($this->skills) && $this->skills !== [],
            is_array($this->education) && $this->education !== [],
            is_array($this->experience) && $this->experience !== [],
            is_array($this->languages) && $this->languages !== [],
            is_array($this->certifications) && $this->certifications !== [],
            filled($user?->phone),
            filled($user?->location),
            filled($this->linkedin_url) || filled($this->github_url),
            filled($user?->resume_path),
        ];

        $done = count(array_filter($checks));

        return (int) round(($done / count($checks)) * 100);
    }

    /**
     * @return list<array{id: string, label: string, complete: bool}>
     */
    public function checklist(?User $user = null): array
    {
        $user ??= $this->relationLoaded('user') ? $this->user : $this->user()->first();

        return [
            [
                'id' => 'personal',
                'label' => 'Personal Info',
                'complete' => filled($user?->name) && filled($user?->email) && filled($user?->phone) && filled($user?->location),
            ],
            [
                'id' => 'professional',
                'label' => 'Professional Info',
                'complete' => filled($this->headline) && (filled($this->current_title) || filled($this->industry)),
            ],
            [
                'id' => 'education',
                'label' => 'Education',
                'complete' => is_array($this->education) && $this->education !== [],
            ],
            [
                'id' => 'experience',
                'label' => 'Work Experience',
                'complete' => is_array($this->experience) && $this->experience !== [],
            ],
            [
                'id' => 'skills',
                'label' => 'Skills',
                'complete' => is_array($this->skills) && $this->skills !== [],
            ],
            [
                'id' => 'languages',
                'label' => 'Languages',
                'complete' => is_array($this->languages) && $this->languages !== [],
            ],
            [
                'id' => 'certifications',
                'label' => 'Certifications',
                'complete' => is_array($this->certifications) && $this->certifications !== [],
            ],
            [
                'id' => 'resume',
                'label' => 'Resume',
                'complete' => filled($user?->resume_path),
            ],
        ];
    }
}
