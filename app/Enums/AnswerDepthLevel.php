<?php

namespace App\Enums;

enum AnswerDepthLevel: string
{
    case Quick = 'quick';
    case Standard = 'standard';
    case DeepDive = 'deep_dive';

    public function label(): string
    {
        return match ($this) {
            self::Quick => 'Quick',
            self::Standard => 'Standard',
            self::DeepDive => 'Deep Dive',
        };
    }
}
