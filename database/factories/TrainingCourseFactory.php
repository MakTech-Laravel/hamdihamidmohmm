<?php

namespace Database\Factories;

use App\Models\TrainingCourse;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TrainingCourse>
 */
class TrainingCourseFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => fake()->unique()->sentence(3),
            'description' => fake()->paragraph(),
            'starts_on' => now()->addWeek()->toDateString(),
            'ends_on' => now()->addWeeks(2)->toDateString(),
            'duration' => '3 days',
            'location' => 'Doha, Qatar',
            'trainer' => fake()->name(),
            'seats' => 20,
            'registration_deadline' => now()->addDays(5)->toDateString(),
            'is_published' => true,
            'questions' => [],
        ];
    }

    public function unpublished(): static
    {
        return $this->state(fn (array $attributes): array => [
            'is_published' => false,
        ]);
    }

    /**
     * @param  list<array{id: string, label: string, type: string, required: bool, options?: list<string>}>  $questions
     */
    public function withQuestions(array $questions): static
    {
        return $this->state(fn (array $attributes): array => [
            'questions' => $questions,
        ]);
    }
}
