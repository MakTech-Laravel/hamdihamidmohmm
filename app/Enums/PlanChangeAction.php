<?php

namespace App\Enums;

enum PlanChangeAction: string
{
    case Select = 'select';
    case Current = 'current';
    case Upgrade = 'upgrade';
    case Downgrade = 'downgrade';

    public function buttonLabel(): string
    {
        return match ($this) {
            self::Select => 'Select Plan',
            self::Current => 'Current Plan',
            self::Upgrade => 'Upgrade Plan',
            self::Downgrade => 'Downgrade Plan',
        };
    }
}
