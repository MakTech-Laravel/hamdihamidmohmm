<?php

namespace App\Services\Ats;

use App\Enums\AtsScoreSource;
use App\Enums\AtsScreeningStatus;
use App\Jobs\ScreenJobApplication;
use App\Models\JobApplication;
use App\Models\JobPost;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class ApplicationScreeningDispatcher
{
    public const MODES = ['unscored', 'failed', 'rules', 'all'];

    private const LOCK_SECONDS = 600;

    public function __construct(private AtsSettings $settings) {}

    /**
     * Queue screening for one application. Returns false when nothing was queued (ATS off or no CV).
     */
    public function dispatchOne(JobApplication $application, bool $force = false): bool
    {
        $application->loadMissing('jobPost.employer');

        if (! $this->settings->enabledForEmployer($application->jobPost?->employer)) {
            return false;
        }

        $path = (string) $application->resume_path;

        if ($path === '' || ! Storage::disk('local')->exists($path)) {
            $this->markStatus($application, AtsScreeningStatus::NoCv);

            return false;
        }

        $this->markStatus($application, AtsScreeningStatus::Pending);

        ScreenJobApplication::dispatch($application->id, $force)->afterCommit();

        return true;
    }

    /**
     * Queue screening for a job's applications in batches. Returns null while another bulk run holds the lock.
     */
    public function dispatchForJob(JobPost $job, string $mode = 'unscored'): ?int
    {
        $job->loadMissing('employer');

        if (! $this->settings->enabledForEmployer($job->employer)) {
            return 0;
        }

        return $this->dispatchQuery(
            $this->scope(JobApplication::query()->where('job_post_id', $job->id), $mode),
            $mode === 'all',
            (string) $job->id,
            "ats:job:{$job->id}",
        );
    }

    /**
     * Queue screening across the platform, optionally limited to one employer or job.
     */
    public function dispatchAll(string $mode = 'unscored', ?int $employerId = null, ?int $jobId = null, bool $force = false): ?int
    {
        $query = JobApplication::query()
            ->whereHas('jobPost.employer', fn (Builder $employer) => $employer->where('ats_enabled', true))
            ->when($employerId !== null, fn (Builder $query) => $query->whereHas('jobPost', fn (Builder $job) => $job->where('employer_id', $employerId)))
            ->when($jobId !== null, fn (Builder $query) => $query->where('job_post_id', $jobId));

        if (! $this->settings->enabled()) {
            return 0;
        }

        return $this->dispatchQuery(
            $this->scope($query, $mode),
            $force || $mode === 'all',
            'all:'.($employerId ?? '*').':'.($jobId ?? '*'),
            "ats:{$mode}",
        );
    }

    /**
     * Re-queue recent applications that fell back to rules or failed, so they get an AI score once providers recover.
     */
    public function dispatchAiRetries(): ?int
    {
        if (! $this->settings->aiEnabled()) {
            return 0;
        }

        $query = JobApplication::query()
            ->whereHas('jobPost.employer', fn (Builder $employer) => $employer->where('ats_enabled', true))
            ->where('created_at', '>=', now()->subHours(max(1, (int) config('ai.ats.retry_ai_within_hours', 48))))
            ->where('ai_attempts', '<', max(1, (int) config('ai.ats.max_ai_attempts', 3)))
            ->where(fn (Builder $query) => $query
                ->where(fn (Builder $rules) => $this->scope($rules, 'rules'))
                ->orWhere('ai_status', AtsScreeningStatus::Failed->value));

        return $this->dispatchQuery($query, false, 'retry-ai', 'ats:retry-ai');
    }

    /**
     * Re-queue applications stuck in pending/processing longer than the configured stale window.
     */
    public function dispatchStaleInFlight(): ?int
    {
        if (! $this->settings->enabled()) {
            return 0;
        }

        $query = JobApplication::query()
            ->whereHas('jobPost.employer', fn (Builder $employer) => $employer->where('ats_enabled', true))
            ->whereIn('ai_status', [
                AtsScreeningStatus::Pending->value,
                AtsScreeningStatus::Processing->value,
            ])
            ->where('updated_at', '<=', now()->subMinutes($this->settings->staleAfterMinutes()));

        return $this->dispatchQuery($query, false, 'stale', 'ats:stale');
    }

    /**
     * @param  Builder<JobApplication>  $query
     * @return Builder<JobApplication>
     */
    public function scope(Builder $query, string $mode): Builder
    {
        return match ($mode) {
            'failed' => $query->whereIn('ai_status', [AtsScreeningStatus::Failed->value, AtsScreeningStatus::Unreadable->value]),
            'rules' => $query
                ->where('ai_status', AtsScreeningStatus::Completed->value)
                ->where('ai_source', AtsScoreSource::Rules->value),
            'all' => $query,
            default => $query->whereNull('ai_status'),
        };
    }

    /**
     * Queue the matching applications in batches of at most 1000. Returns null while another bulk run holds the lock.
     *
     * @param  Builder<JobApplication>  $query
     */
    public function dispatchQuery(Builder $query, bool $force, string $lockKey, string $batchName): ?int
    {
        $lock = Cache::lock('ats:bulk:'.$lockKey, self::LOCK_SECONDS);

        if (! $lock->get()) {
            return null;
        }

        $queued = 0;
        $part = 0;

        try {
            $query->select('id')->chunkById($this->settings->batchSize(), function (Collection $applications) use ($force, $batchName, &$queued, &$part): void {
                $ids = $applications->modelKeys();
                $part++;

                JobApplication::query()->whereKey($ids)->toBase()->update(['ai_status' => AtsScreeningStatus::Pending->value]);

                Bus::batch(array_map(fn (int $id): ScreenJobApplication => new ScreenJobApplication($id, $force), $ids))
                    ->name("{$batchName}:part{$part}")
                    ->onQueue($this->settings->queue())
                    ->allowFailures()
                    ->dispatch();

                $queued += count($ids);
            });
        } finally {
            $lock->release();
        }

        return $queued;
    }

    private function markStatus(JobApplication $application, AtsScreeningStatus $status): void
    {
        $application->forceFill([
            'ai_status' => $status,
            'ai_scored_at' => $status === AtsScreeningStatus::NoCv ? now() : $application->ai_scored_at,
        ]);

        // Pending bumps updated_at so the stale sweeper can age the queue time.
        if ($status === AtsScreeningStatus::Pending) {
            $application->saveQuietly();

            return;
        }

        JobApplication::withoutTimestamps(fn () => $application->saveQuietly());
    }
}
