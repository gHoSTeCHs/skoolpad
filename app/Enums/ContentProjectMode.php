<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum ContentProjectMode: string
{
    use HasSelectOptions;

    case Secondary = 'secondary';
    case Tertiary = 'tertiary';

    public function label(): string
    {
        return match ($this) {
            self::Secondary => 'Secondary',
            self::Tertiary => 'Tertiary',
        };
    }
}
