<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum Relevance: string
{
    use HasSelectOptions;

    case Primary = 'primary';
    case Secondary = 'secondary';
    case Prerequisite = 'prerequisite';

    public function label(): string
    {
        return match ($this) {
            self::Primary => 'Primary',
            self::Secondary => 'Secondary',
            self::Prerequisite => 'Prerequisite',
        };
    }
}
