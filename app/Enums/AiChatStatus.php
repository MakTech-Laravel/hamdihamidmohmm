<?php

namespace App\Enums;

enum AiChatStatus: string
{
    case Answered = 'answered';
    case Fallback = 'fallback';
    case Failed = 'failed';

    public function label(): string
    {
        return match ($this) {
            self::Answered => 'Answered',
            self::Fallback => 'Sent to support',
            self::Failed => 'Failed',
        };
    }
}
