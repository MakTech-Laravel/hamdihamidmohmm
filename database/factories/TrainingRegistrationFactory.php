<?php

namespace Database\Factories;

use App\Enums\TrainingRegistrationStatus;
use App\Models\TrainingCourse;
use App\Models\TrainingRegistration;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TrainingRegistration>
 */
class TrainingRegistrationFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'training_course_id' => TrainingCourse::factory(),
            'user_id' => null,
            'registration_number' => 'TR-'.now()->format('Y').'-'.fake()->unique()->numerify('#####'),
            'public_token' => TrainingRegistration::newPublicToken(),
            'full_name' => fake()->name(),
            'email' => fake()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'country_city' => 'Doha, Qatar',
            'organization' => fake()->company(),
            'job_title' => fake()->jobTitle(),
            'experience' => fake()->sentence(),
            'reason' => fake()->sentence(),
            'answers' => [],
            'consent_accepted_at' => now(),
            'status' => TrainingRegistrationStatus::Pending,
        ];
    }
}
