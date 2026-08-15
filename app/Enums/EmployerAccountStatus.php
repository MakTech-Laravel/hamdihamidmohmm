<?php

namespace App\Enums;

enum EmployerAccountStatus: string
{
    case Active = 'active';
    case PendingVerification = 'pending_verification';
    case Suspended = 'suspended';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Active',
            self::PendingVerification => 'Pending Verification',
            self::Suspended => 'Suspended',
            self::Rejected => 'Rejected',
        };
    }

    public function filterKey(): string
    {
        return match ($this) {
            self::Active => 'active',
            self::PendingVerification => 'pending',
            self::Suspended => 'suspended',
            self::Rejected => 'rejected',
        };
    }

    public static function fromFilter(string $filter): ?self
    {
        return match ($filter) {
            'active' => self::Active,
            'pending' => self::PendingVerification,
            'suspended' => self::Suspended,
            'rejected' => self::Rejected,
            default => self::tryFrom($filter),
        };
    }
}
