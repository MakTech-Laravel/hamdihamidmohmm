<?php

namespace App\Listeners;

use App\Enums\ActivityAction;
use App\Models\User;
use App\Support\ActivityLogger;
use Illuminate\Auth\Events\Login;

class LogUserLogin
{
    public function handle(Login $event): void
    {
        if (! $event->user instanceof User) {
            return;
        }

        ActivityLogger::log(
            $event->user,
            ActivityAction::LoggedIn,
            'Signed in to the portal.',
            $event->user,
        );
    }
}
