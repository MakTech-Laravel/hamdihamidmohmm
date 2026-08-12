<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use App\Support\RoleAssigner;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $superAdmin = User::query()->updateOrCreate(
            ['email' => 'admin@dev.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('admin@dev.com'),
                'email_verified_at' => now(),
                'role' => UserRole::SuperAdmin,
            ],
        );

        RoleAssigner::assign($superAdmin, UserRole::SuperAdmin);

        $admin = User::query()->updateOrCreate(
            ['email' => 'panel@dev.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('panel@dev.com'),
                'email_verified_at' => now(),
                'role' => UserRole::Admin,
            ],
        );

        RoleAssigner::assign($admin, UserRole::Admin);
    }
}
