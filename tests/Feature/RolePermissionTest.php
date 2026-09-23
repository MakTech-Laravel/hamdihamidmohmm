<?php

use App\Enums\RoleName;
use App\Enums\UserRole;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Spatie\Permission\Models\Role;

test('role permission seeder creates expected roles', function () {
    $this->seed(RolePermissionSeeder::class);

    expect(RoleName::cases())->each(function ($role) {
        expect(Role::query()->where('name', $role->value)->exists())->toBeTrue();
    });
});

test('registration assigns spatie roles for job seekers and employers', function () {
    $this->post(route('register.store'), [
        'name' => 'Amina Seeker',
        'email' => 'seeker-role@example.com',
        'phone' => '+249900000016',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => UserRole::JobSeeker->value,
        'terms' => '1',
    ])->assertRedirect(route('job-seeker.profile', absolute: false));

    $seeker = User::query()->where('email', 'seeker-role@example.com')->first();

    expect($seeker)->not->toBeNull()
        ->and($seeker->hasRole(RoleName::JobSeeker->value))->toBeTrue();

    $this->post(route('logout'));

    $this->post(route('register.store'), [
        'company_name' => 'Acme Hiring',
        'email' => 'employer-role@example.com',
        'phone' => '+249900000017',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => UserRole::Employer->value,
        'terms' => '1',
    ])->assertRedirect(route('login', absolute: false));

    $employer = User::query()->where('email', 'employer-role@example.com')->first();

    expect($employer)->not->toBeNull()
        ->and($employer->hasRole(RoleName::Employer->value))->toBeTrue();
});
