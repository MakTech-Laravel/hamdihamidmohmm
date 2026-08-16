<?php

namespace App\Enums;

enum JobPostStatus: string
{
    case Draft = 'draft';
    case Pending = 'pending';
    case Active = 'active';
    case Rejected = 'rejected';
    case Expired = 'expired';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Pending => 'Pending',
            self::Active => 'Active',
            self::Rejected => 'Rejected',
            self::Expired => 'Expired',
        };
    }

    public static function fromFilter(string $filter): ?self
    {
        return match ($filter) {
            'draft' => self::Draft,
            'pending' => self::Pending,
            'active' => self::Active,
            'rejected' => self::Rejected,
            'expired' => self::Expired,
            default => self::tryFrom($filter),
        };
    }
}
