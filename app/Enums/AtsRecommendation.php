<?php

namespace App\Enums;

enum AtsRecommendation: string
{
    case StrongMatch = 'strong_match';
    case PossibleMatch = 'possible_match';
    case NotAFit = 'not_a_fit';

    public function label(): string
    {
        return match ($this) {
            self::StrongMatch => 'Strong match',
            self::PossibleMatch => 'Possible match',
            self::NotAFit => 'Not a fit',
        };
    }

    public static function fromScore(int $score, int $strongThreshold, int $possibleThreshold): self
    {
        return match (true) {
            $score >= $strongThreshold => self::StrongMatch,
            $score >= $possibleThreshold => self::PossibleMatch,
            default => self::NotAFit,
        };
    }
}
