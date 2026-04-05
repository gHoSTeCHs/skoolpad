<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum SpacedRepetitionStatus: string
{
    use HasSelectOptions;
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
