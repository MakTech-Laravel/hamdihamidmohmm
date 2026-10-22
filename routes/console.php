<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('ats:retry-ai')->hourly()->withoutOverlapping();

Schedule::command('ats:recover-stale')->everyFifteenMinutes()->withoutOverlapping();

Schedule::command('ats:score --only=unscored')->daily()->withoutOverlapping();

if (config('queue.run_via_scheduler')) {
    Schedule::command('queue:work --queue=default,'.config('ai.ats.queue', 'ats').' --stop-when-empty --max-time=55 --tries=3 --timeout=120')
        ->everyMinute()
        ->withoutOverlapping(5);
}
