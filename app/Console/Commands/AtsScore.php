<?php

namespace App\Console\Commands;

use App\Services\Ats\ApplicationScreeningDispatcher;
use Illuminate\Console\Command;

class AtsScore extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ats:score
        {--job= : Only score applications for this job post ID}
        {--employer= : Only score applications for this employer user ID}
        {--only=unscored : Which applications to queue: unscored, failed, rules or all}
        {--force : Re-score even when the CV and job have not changed}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Queue ATS screening for job applications in batches of up to 1000';

    /**
     * Execute the console command.
     */
    public function handle(ApplicationScreeningDispatcher $dispatcher): int
    {
        $mode = (string) $this->option('only');

        if (! in_array($mode, ApplicationScreeningDispatcher::MODES, true)) {
            $this->error('The --only option must be one of: '.implode(', ', ApplicationScreeningDispatcher::MODES).'.');

            return self::FAILURE;
        }

        $queued = $dispatcher->dispatchAll(
            $mode,
            $this->option('employer') !== null ? (int) $this->option('employer') : null,
            $this->option('job') !== null ? (int) $this->option('job') : null,
            (bool) $this->option('force'),
        );

        if ($queued === null) {
            $this->warn('Another ATS bulk run is already queueing these applications. Try again shortly.');

            return self::SUCCESS;
        }

        $this->info("Queued {$queued} application(s) for ATS screening.");

        return self::SUCCESS;
    }
}
