<?php

namespace App\Models;

use App\Enums\AtsRecommendation;
use App\Enums\AtsScoreSource;
use App\Enums\AtsScreeningStatus;
use App\Enums\JobApplicationStatus;
use Database\Factories\JobApplicationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobApplication extends Model
{
    /** @use HasFactory<JobApplicationFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'job_post_id',
        'job_seeker_id',
        'status',
        'cover_letter',
        'question_answers',
        'resume_path',
        'resume_original_name',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => JobApplicationStatus::class,
            'question_answers' => 'array',
            'ai_status' => AtsScreeningStatus::class,
            'ai_source' => AtsScoreSource::class,
            'ai_recommendation' => AtsRecommendation::class,
            'ai_breakdown' => 'array',
            'ai_score' => 'integer',
            'ai_scored_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<JobPost, $this>
     */
    public function jobPost(): BelongsTo
    {
        return $this->belongsTo(JobPost::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function jobSeeker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'job_seeker_id');
    }

    /**
     * @return list<array{label: string, date: string|null, state: string}>
     */
    public function timeline(): array
    {
        $current = $this->status ?? JobApplicationStatus::Applied;
        $reached = false;

        if ($current->isOffPipeline()) {
            return [
                ['label' => 'Applied', 'date' => $this->created_at?->toDateString(), 'state' => 'done'],
                ['label' => $current->label(), 'date' => $this->updated_at?->toDateString(), 'state' => 'current'],
            ];
        }

        $steps = [];

        foreach (JobApplicationStatus::Applied->timeline() as $step) {
            if ($step === $current) {
                $steps[] = [
                    'label' => $step->label(),
                    'date' => $this->updated_at?->toDateString(),
                    'state' => 'current',
                ];
                $reached = true;

                continue;
            }

            $steps[] = [
                'label' => $step->label(),
                'date' => $reached ? null : ($step === JobApplicationStatus::Applied ? $this->created_at?->toDateString() : null),
                'state' => $reached ? 'pending' : 'done',
            ];
        }

        return $steps;
    }
}
