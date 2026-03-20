<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum Term: string
{
    use HasSelectOptions;

    case First = 'first';
    case Second = 'second';
    case Third = 'third';

    public function label(): string
    {
        return match ($this) {
            self::First => 'First Term',
            self::Second => 'Second Term',
            self::Third => 'Third Term',
        };
    }

    public function toInt(): int
    {
        return match ($this) {
            self::First => 1,
            self::Second => 2,
            self::Third => 3,
        };
    }
}
