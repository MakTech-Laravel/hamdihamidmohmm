<?php

namespace Database\Factories;

use App\Models\JobAlert;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<JobAlert>
 */
class JobAlertFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->jobSeeker(),
            'name' => 'IT System Administrator',
            'keyword' => 'System Administrator',
            'country' => null,
            'location' => null,
            'category' => null,
            'employment_type' => null,
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (): array => ['is_active' => false]);
    }
}
