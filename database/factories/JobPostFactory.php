<?php

namespace Database\Factories;

use App\Enums\JobPostStatus;
use App\Models\JobPost;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<JobPost>
 */
class JobPostFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->jobTitle();

        return [
            'employer_id' => User::factory()->employer(),
            'title' => $title,
            'slug' => Str::slug($title).'-'.Str::lower(Str::random(6)),
            'category' => fake()->randomElement(['Technology', 'Construction', 'Finance', 'Retail', 'Healthcare', 'Logistics']),
            'location' => fake()->randomElement(['Dubai, UAE', 'Abu Dhabi, UAE', 'Sharjah, UAE', 'Remote']),
            'employment_type' => fake()->randomElement(['Full-time', 'Part-time', 'Contract', 'Remote']),
            'experience_level' => fake()->randomElement(['Entry Level', 'Mid Level', 'Senior']),
            'salary_range' => 'SGD '.fake()->numberBetween(5, 12).',000 - '.fake()->numberBetween(13, 25).',000',
            'description' => fake()->paragraphs(3, true),
            'requirements' => fake()->paragraph(),
            'skills' => fake()->randomElements(['React', 'TypeScript', 'Laravel', 'PHP', 'Figma'], 3),
            'status' => JobPostStatus::Active,
            'featured' => false,
            'views' => fake()->numberBetween(0, 500),
            'expires_at' => now()->addDays(30),
        ];
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => JobPostStatus::Draft,
            'expires_at' => null,
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => JobPostStatus::Pending,
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => JobPostStatus::Expired,
            'expires_at' => now()->subDay(),
        ]);
    }
}
