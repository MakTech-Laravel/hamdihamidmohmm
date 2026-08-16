<?php

namespace App\Casts;

use App\Enums\EmployerAccountStatus;
use App\Enums\JobSeekerAccountStatus;
use App\Enums\UserRole;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * @implements CastsAttributes<EmployerAccountStatus|JobSeekerAccountStatus|null, EmployerAccountStatus|JobSeekerAccountStatus|string|null>
 */
class AccountStatusCast implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): EmployerAccountStatus|JobSeekerAccountStatus|null
    {
        if (! is_string($value) || $value === '') {
            return null;
        }

        $role = $attributes['role'] ?? null;
        $roleValue = $role instanceof UserRole ? $role->value : $role;

        if ((int) $roleValue === UserRole::JobSeeker->value) {
            return JobSeekerAccountStatus::tryFrom($value);
        }

        return EmployerAccountStatus::tryFrom($value);
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if ($value instanceof EmployerAccountStatus || $value instanceof JobSeekerAccountStatus) {
            return $value->value;
        }

        return (string) $value;
    }
}
