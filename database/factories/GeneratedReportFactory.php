<?php

namespace Database\Factories;

use App\Models\GeneratedReport;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GeneratedReport>
 */
class GeneratedReportFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => 'Employers export',
            'module' => 'employers',
            'format' => 'csv',
            'path' => 'reports/employers.csv',
            'generated_by' => User::factory()->admin(),
            'generated_at' => now(),
        ];
    }
}
