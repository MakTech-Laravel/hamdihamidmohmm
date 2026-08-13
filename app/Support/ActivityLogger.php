<?php

namespace App\Support;

use App\Enums\ActivityAction;
use App\Models\ActivityLog;
use App\Models\User;

class ActivityLogger
{
    /**
     * @param  array<string, mixed>  $properties
     */
    public static function log(
        User $subject,
        ActivityAction $action,
        string $description,
        ?User $actor = null,
        array $properties = [],
    ): ActivityLog {
        return ActivityLog::query()->create([
            'user_id' => $subject->id,
            'actor_id' => $actor?->id,
            'action' => $action,
            'description' => $description,
            'properties' => $properties === [] ? null : $properties,
            'ip_address' => request()->ip(),
        ]);
    }
}
