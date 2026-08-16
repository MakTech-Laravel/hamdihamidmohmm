<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use App\Support\RoleAssigner;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jobSeeker = User::query()->updateOrCreate(
            ['email' => 'seeker@dev.com'],
            [
                'name' => 'Job Seeker',
                'company_name' => null,
                'password' => Hash::make('seeker@dev.com'),
                'email_verified_at' => now(),
                'role' => UserRole::JobSeeker,
            ],
        );

        RoleAssigner::assign($jobSeeker, UserRole::JobSeeker);

        $employer = User::query()->updateOrCreate(
            ['email' => 'employer@dev.com'],
            [
                'name' => 'Horizon Hiring Ltd',
                'company_name' => 'Horizon Hiring Ltd',
                'password' => Hash::make('employer@dev.com'),
                'email_verified_at' => now(),
                'role' => UserRole::Employer,
            ],
        );

        RoleAssigner::assign($employer, UserRole::Employer);
    }
}
