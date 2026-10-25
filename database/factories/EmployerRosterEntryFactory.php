<?php

namespace Database\Factories;

use App\Models\EmployerRosterEntry;
use App\Models\JobApplication;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EmployerRosterEntry>
 */
class EmployerRosterEntryFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $owner = User::factory()->employer();

        return [
            'employer_owner_id' => $owner,
            'job_seeker_id' => User::factory()->jobSeeker(),
            'job_application_id' => JobApplication::factory(),
            'category' => fake()->randomElement(['Talent pool', 'Referral', 'Future hire', 'Hold']),
            'comments' => fake()->optional()->sentence(),
            'added_by' => $owner,
        ];
    }
}
