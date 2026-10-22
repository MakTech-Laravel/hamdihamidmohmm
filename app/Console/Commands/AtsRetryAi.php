<?php

namespace App\Console\Commands;

use App\Services\Ats\ApplicationScreeningDispatcher;
use Illuminate\Console\Command;

class AtsRetryAi extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ats:retry-ai';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Retry AI scoring for recent applications that fell back to basic matching or failed';

    /**
     * Execute the console command.
     */
    public function handle(ApplicationScreeningDispatcher $dispatcher): int
    {
        $queued = $dispatcher->dispatchAiRetries();

        if ($queued === null) {
            $this->warn('An ATS retry run is already in progress.');

            return self::SUCCESS;
        }

        $this->info("Queued {$queued} application(s) for AI re-scoring.");

        return self::SUCCESS;
    }
}
