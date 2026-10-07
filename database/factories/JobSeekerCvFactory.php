<?php

namespace Database\Factories;

use App\Models\JobSeekerCv;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Storage;

/**
 * @extends Factory<JobSeekerCv>
 */
class JobSeekerCvFactory extends Factory
{
    protected $model = JobSeekerCv::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $user = User::factory()->jobSeeker();

        return [
            'user_id' => $user,
            'label' => fake()->randomElement(['IT Support', 'IT Administrator', 'General CV']),
            'file_path' => 'resumes/demo/' . fake()->uuid() . '.pdf',
            'original_name' => fake()->slug(2) . '-cv.pdf',
            'is_default' => false,
        ];
    }

    public function default(): static
    {
        return $this->state(fn(): array => ['is_default' => true]);
    }

    public function withStoredFile(?string $contents = null): static
    {
        return $this->afterCreating(function (JobSeekerCv $cv) use ($contents): void {
            Storage::disk('local')->put(
                (string) $cv->file_path,
                $contents ?? '%PDF-1.4 cv-content',
            );
        });
    }
}
