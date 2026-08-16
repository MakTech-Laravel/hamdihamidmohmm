<?php

namespace App\Enums;

enum ContentPageType: string
{
    case Page = 'page';
    case Announcement = 'announcement';

    public function label(): string
    {
        return match ($this) {
            self::Page => 'Page',
            self::Announcement => 'Announcement',
        };
    }
}
