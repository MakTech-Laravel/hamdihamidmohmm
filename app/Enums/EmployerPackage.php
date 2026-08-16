<?php

namespace App\Enums;

enum EmployerPackage: string
{
    case Starter = 'starter';
    case Professional = 'professional';
    case Premium = 'premium';
    case Enterprise = 'enterprise';

    public function label(): string
    {
        return match ($this) {
            self::Starter => 'Starter',
            self::Professional => 'Single Posting',
            self::Premium => 'Business Package',
            self::Enterprise => 'Enterprise',
        };
    }
}
