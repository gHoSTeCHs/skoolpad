<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum OwnershipType: string
{
    use HasSelectOptions;

    case Federal = 'federal';
    case State = 'state';
    case Private = 'private';

    public function label(): string
    {
        return match ($this) {
            self::Federal => 'Federal',
            self::State => 'State',
            self::Private => 'Private',
        };
    }
}
