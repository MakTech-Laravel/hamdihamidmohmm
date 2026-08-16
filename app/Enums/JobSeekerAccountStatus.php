<?php

namespace App\Enums;

enum JobSeekerAccountStatus: string
{
    case Active = 'active';
    case Inactive = 'inactive';
    case Suspended = 'suspended';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Active',
            self::Inactive => 'Inactive',
            self::Suspended => 'Suspended',
        };
    }

    public static function fromFilter(string $filter): ?self
    {
        return match ($filter) {
            'active' => self::Active,
            'inactive' => self::Inactive,
            'suspended' => self::Suspended,
            default => self::tryFrom($filter),
        };
    }
}
