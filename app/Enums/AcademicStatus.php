<?php

namespace App\Enums;

enum AcademicStatus: string
{
    case Active = 'active';
    case OnStrike = 'on_strike';
    case OnBreak = 'on_break';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Active',
            self::OnStrike => 'On Strike',
            self::OnBreak => 'On Break',
        };
    }
}
