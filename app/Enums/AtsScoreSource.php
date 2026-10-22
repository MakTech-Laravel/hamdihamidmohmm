<?php

namespace App\Enums;

enum AtsScoreSource: string
{
    case Ai = 'ai';
    case Rules = 'rules';

    public function label(): string
    {
        return match ($this) {
            self::Ai => 'AI',
            self::Rules => 'Basic match',
        };
    }
}
