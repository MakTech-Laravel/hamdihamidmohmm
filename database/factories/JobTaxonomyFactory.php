<?php

namespace Database\Factories;

use App\Enums\JobTaxonomyType;
use App\Models\JobTaxonomy;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<JobTaxonomy>
 */
class JobTaxonomyFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);

        return [
            'type' => fake()->randomElement(JobTaxonomyType::cases()),
            'name' => Str::title($name),
            'slug' => Str::slug($name),
            'is_active' => true,
            'sort_order' => fake()->numberBetween(0, 100),
        ];
    }

    public function country(): static
    {
        return $this->state(fn (): array => ['type' => JobTaxonomyType::Country]);
    }

    public function dutyStation(): static
    {
        return $this->state(fn (): array => ['type' => JobTaxonomyType::DutyStation]);
    }

    public function positionArea(): static
    {
        return $this->state(fn (): array => ['type' => JobTaxonomyType::PositionArea]);
    }

    public function employmentType(): static
    {
        return $this->state(fn (): array => ['type' => JobTaxonomyType::EmploymentType]);
    }

    public function inactive(): static
    {
        return $this->state(fn (): array => ['is_active' => false]);
    }
}
