<?php

namespace App\Enums;

enum UserRole: int
{
    case ADMIN = 1;
    case USER = 2;

    public function label(): string
    {
        return match ($this) {
            self::ADMIN => 'Admin',
            self::USER => 'User',
        };
    }

    public function isAdmin(): bool
    {
        return $this === self::ADMIN;
    }

    public function isUser(): bool
    {
        return $this === self::USER;
    }

    public function canManageUsers(): bool
    {
        return $this === self::ADMIN;
    }

    public function canAccessPayroll(): bool
    {
        return $this === self::ADMIN;
    }
}
