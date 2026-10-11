<?php

namespace App\Enums;

enum TrainingRegistrationStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Waitlisted = 'waitlisted';
    case Rejected = 'rejected';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Approved => 'Approved',
            self::Waitlisted => 'Waitlisted',
            self::Rejected => 'Rejected',
            self::Completed => 'Completed',
            self::Cancelled => 'Cancelled',
        };
    }

    public function occupiesSeat(): bool
    {
        return match ($this) {
            self::Pending, self::Approved, self::Completed => true,
            self::Waitlisted, self::Rejected, self::Cancelled => false,
        };
    }

    /**
     * @return list<string>
     */
    public static function occupyingValues(): array
    {
        return array_values(array_map(
            fn (self $status): string => $status->value,
            array_filter(self::cases(), fn (self $status): bool => $status->occupiesSeat()),
        ));
    }
};
