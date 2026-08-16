<?php

namespace Database\Factories;

use App\Models\JobSeekerProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<JobSeekerProfile>
 */
class JobSeekerProfileFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->jobSeeker(),
            'headline' => fake()->jobTitle(),
            'bio' => fake()->paragraph(),
            'skills' => ['PHP', 'Laravel', 'React'],
            'education' => [['school' => fake()->company(), 'degree' => 'BSc']],
            'experience' => [['company' => fake()->company(), 'title' => fake()->jobTitle()]],
            'languages' => ['English', 'Arabic'],
            'certifications' => [],
        ];
    }
}
