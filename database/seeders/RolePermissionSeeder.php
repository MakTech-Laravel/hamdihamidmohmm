<?php

namespace Database\Seeders;

use App\Enums\PermissionName;
use App\Enums\RoleName;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
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

        $superAdmin = $this->systemRole(
            RoleName::SuperAdmin,
            'Full platform access. Permissions cannot be reduced.',
            locked: true,
        );
        $admin = $this->systemRole(
            RoleName::Admin,
            'Staff access to the admin portal. Permissions can be adjusted.',
        );
        $jobSeeker = $this->systemRole(
            RoleName::JobSeeker,
            'Public portal access for candidates.',
        );
        $employer = $this->systemRole(
            RoleName::Employer,
            'Public portal access for hiring companies.',
        );

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

    private function systemRole(RoleName $roleName, string $description, bool $locked = false): Role
    {
        $role = Role::findOrCreate($roleName->value, 'web');

        $role->forceFill([
            'label' => $roleName->label(),
            'description' => $description,
            'is_system' => true,
            'is_locked' => $locked,
        ])->save();

        return $role->fresh();
    }
}
