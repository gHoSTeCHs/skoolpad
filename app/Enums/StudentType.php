<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum StudentType: string
{
    use HasSelectOptions;

    case Tertiary = 'tertiary';
    case Secondary = 'secondary';

    public function label(): string
    {
        return match ($this) {
            self::Tertiary => 'Tertiary',
            self::Secondary => 'Secondary',
        };
    }
}
