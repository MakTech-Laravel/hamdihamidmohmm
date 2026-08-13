<?php

namespace Database\Factories;

use App\Enums\ActivityAction;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ActivityLog>
 */
class ActivityLogFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'actor_id' => null,
            'action' => ActivityAction::LoggedIn,
            'description' => 'Signed in to the portal.',
            'properties' => null,
            'ip_address' => fake()->ipv4(),
        ];
    }
}
