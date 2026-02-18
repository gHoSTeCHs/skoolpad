<?php

namespace App\Enums;

enum Semester: string
{
    case First = 'first';
    case Second = 'second';
    case Both = 'both';

    public function label(): string
    {
        return match ($this) {
            self::First => 'First',
            self::Second => 'Second',
            self::Both => 'Both',
        };
    }

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
