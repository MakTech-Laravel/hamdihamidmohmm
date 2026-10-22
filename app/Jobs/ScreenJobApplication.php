<?php

namespace App\Jobs;

use App\Models\JobApplication;
use App\Services\Ats\ApplicationScreeningService;
use App\Services\Ats\AtsSettings;
use DateTimeInterface;
use Illuminate\Bus\Batchable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Middleware\RateLimited;
use Throwable;

class ScreenJobApplication implements ShouldBeUnique, ShouldQueue
{
    use Batchable, Queueable;

    public int $timeout = 120;

    public int $maxExceptions = 3;

    public int $uniqueFor = 3600;

    public function __construct(public int $applicationId, public bool $force = false)
    {
        $this->onQueue(app(AtsSettings::class)->queue());
    }

    public function uniqueId(): string
    {
        return (string) $this->applicationId;
    }

    public function retryUntil(): DateTimeInterface
    {
        return now()->addHours(12);
    }

    /**
     * @return list<int>
     */
    public function backoff(): array
    {
        return [30, 120, 300];
    }

    /**
     * @return list<object>
     */
    public function middleware(): array
    {
        return app(AtsSettings::class)->aiEnabled() ? [new RateLimited('ats-ai')] : [];
    }

    public function handle(ApplicationScreeningService $screening): void
    {
        if ($this->batch()?->cancelled()) {
            return;
        }

        $application = JobApplication::query()->find($this->applicationId);

        if ($application === null) {
            return;
        }

        try {
            $screening->screen($application, $this->force);
        } catch (Throwable $exception) {
            report($exception);
            $screening->markFailed($application, $exception);
        }
    }

    public function failed(?Throwable $exception): void
    {
        $application = JobApplication::query()->find($this->applicationId);

        if ($application !== null && ($application->ai_status === null || $application->ai_status->isInFlight())) {
            app(ApplicationScreeningService::class)->markFailed($application, $exception);
        }
    }
}
