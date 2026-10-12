<?php

namespace App\Enums;

enum AiChatChannel: string
{
    case Public = 'public';
    case Admin = 'admin';

    public function label(): string
    {
        return match ($this) {
            self::Public => 'Website & Job Seeker',
            self::Admin => 'Admin Dashboard',
        };
    }
}
