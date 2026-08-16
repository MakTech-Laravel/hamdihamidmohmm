<?php

namespace App\Enums;

enum JobSeekerResumeStatus: string
{
    case Active = 'active';
    case Warning = 'warning';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Active',
            self::Warning => 'Warning',
        };
    }
}
