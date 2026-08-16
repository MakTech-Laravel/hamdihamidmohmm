<?php

namespace Database\Factories;

use App\Enums\JobApplicationStatus;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<JobApplication>
 */
class JobApplicationFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'job_post_id' => JobPost::factory(),
            'job_seeker_id' => User::factory()->jobSeeker(),
            'status' => JobApplicationStatus::Applied,
            'cover_letter' => fake()->paragraph(),
        ];
    }
}
