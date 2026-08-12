<?php

use App\Enums\RoleName;
use App\Enums\UserRole;
use App\Models\User;
use App\Support\RoleAssigner;

test('role assigner syncs enum and spatie role', function () {
    $user = User::factory()->jobSeeker()->create();

    RoleAssigner::assign($user, UserRole::Employer);

    expect($user->fresh()->role)->toBe(UserRole::Employer)
        ->and($user->fresh()->hasRole(RoleName::Employer->value))->toBeTrue()
        ->and($user->fresh()->hasRole(RoleName::JobSeeker->value))->toBeFalse();
});
