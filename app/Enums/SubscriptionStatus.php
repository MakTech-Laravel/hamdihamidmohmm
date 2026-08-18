<?php

namespace App\Enums;

enum SubscriptionStatus: string
{
    case Incomplete = 'incomplete';
    case IncompleteExpired = 'incomplete_expired';
    case Trialing = 'trialing';
    case Active = 'active';
    case PastDue = 'past_due';
    case Canceled = 'canceled';
    case Unpaid = 'unpaid';
    case Paused = 'paused';

    public function label(): string
    {
        return match ($this) {
            self::Incomplete => 'Incomplete',
            self::IncompleteExpired => 'Expired',
            self::Trialing => 'Trialing',
            self::Active => 'Active',
            self::PastDue => 'Past due',
            self::Canceled => 'Canceled',
            self::Unpaid => 'Unpaid',
            self::Paused => 'Paused',
        };
    }

    public function isActive(): bool
    {
        return in_array($this, [self::Active, self::Trialing], true);
    }

    public static function fromStripe(?string $status): ?self
    {
        if ($status === null || $status === '') {
            return null;
        }

        return self::tryFrom($status);
    }
}
