<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum ParentalRelationship: string
{
    use HasSelectOptions;

    case Mother = 'mother';
    case Father = 'father';
    case Guardian = 'guardian';

    public function label(): string
    {
        return match ($this) {
            self::Mother => 'Mother',
            self::Father => 'Father',
            self::Guardian => 'Guardian',
        };
    }
}
