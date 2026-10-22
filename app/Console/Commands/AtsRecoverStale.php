<?php

namespace App\Console\Commands;

use App\Services\Ats\ApplicationScreeningDispatcher;
use Illuminate\Console\Command;

class AtsRecoverStale extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ats:recover-stale';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Re-queue ATS applications stuck in pending or processing';

    /**
     * Execute the console command.
     */
    public function handle(ApplicationScreeningDispatcher $dispatcher): int
    {
        $queued = $dispatcher->dispatchStaleInFlight();

        if ($queued === null) {
            $this->warn('An ATS stale recovery run is already in progress.');

            return self::SUCCESS;
        }

        $this->info("Queued {$queued} stale application(s) for ATS screening.");

        return self::SUCCESS;
    }
}
