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
            'current_title' => fake()->jobTitle(),
            'experience_years' => (string) fake()->numberBetween(1, 12),
            'bio' => fake()->paragraph(),
            'linkedin_url' => 'https://linkedin.com/in/'.fake()->userName(),
            'github_url' => 'https://github.com/'.fake()->userName(),
            'industry' => 'Information Technology',
            'expected_salary' => 'SAR '.fake()->numberBetween(10, 18).',000 - '.fake()->numberBetween(19, 28).',000',
            'availability' => ['Full Time', 'Remote'],
            'skills' => ['PHP', 'Laravel', 'React'],
            'education' => [[
                'degree' => 'Bachelor of Science in Computer Science',
                'school' => 'King Fahd University',
                'years' => '2015 - 2019',
            ]],
            'experience' => [[
                'title' => fake()->jobTitle(),
                'company' => fake()->company(),
                'years' => 3,
                'dates' => '2021 - Present',
                'description' => fake()->sentence(),
            ]],
            'languages' => [
                ['name' => 'Arabic', 'level' => 'Native'],
                ['name' => 'English', 'level' => 'Advanced'],
            ],
            'certifications' => [[
                'name' => 'AWS Certified Developer',
                'issuer' => 'Amazon Web Services',
                'date' => '2024-03',
            ]],
            'references' => [],
        ];
    }
}
