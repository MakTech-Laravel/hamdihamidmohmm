<?php

namespace App\Enums;

enum AtsScreeningStatus: string
{
    case Pending = 'pending';
    case Processing = 'processing';
    case Completed = 'completed';
    case Failed = 'failed';
    case NoCv = 'no_cv';
    case Unreadable = 'unreadable';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Processing => 'Scoring',
            self::Completed => 'Scored',
            self::Failed => 'Failed',
            self::NoCv => 'No CV',
            self::Unreadable => 'CV unreadable',
        };
    }

    public function isInFlight(): bool
    {
        return $this === self::Pending || $this === self::Processing;
    }
}
