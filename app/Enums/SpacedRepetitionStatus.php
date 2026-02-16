<?php

namespace App\Enums;

enum SpacedRepetitionStatus: string
{
    case Active = 'active';
    case Graduated = 'graduated';
    case Suspended = 'suspended';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Active',
            self::Graduated => 'Graduated',
            self::Suspended => 'Suspended',
        };
    }
}
