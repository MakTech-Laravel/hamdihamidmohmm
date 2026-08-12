<?php

namespace Database\Seeders;

use App\Enums\PermissionName;
use App\Enums\RoleName;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        foreach (PermissionName::cases() as $permission) {
            Permission::findOrCreate($permission->value, 'web');
        }

        $superAdmin = Role::findOrCreate(RoleName::SuperAdmin->value, 'web');
        $admin = Role::findOrCreate(RoleName::Admin->value, 'web');
        $jobSeeker = Role::findOrCreate(RoleName::JobSeeker->value, 'web');
        $employer = Role::findOrCreate(RoleName::Employer->value, 'web');

        $superAdmin->syncPermissions(collect(PermissionName::cases())->map->value->all());

        $admin->syncPermissions([
            PermissionName::AccessAdminPanel->value,
            PermissionName::ManageUsers->value,
            PermissionName::ManageEmployers->value,
            PermissionName::ManageJobSeekers->value,
            PermissionName::ManageJobs->value,
            PermissionName::ManagePackages->value,
            PermissionName::ManagePayments->value,
            PermissionName::ManageVerification->value,
            PermissionName::ViewAnalytics->value,
        ]);

        $jobSeeker->syncPermissions([]);
        $employer->syncPermissions([]);
    }
}
