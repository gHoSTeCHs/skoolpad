<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum ThinkingMode: string
{
    use HasSelectOptions;

    case None = 'none';
    case Standard = 'standard';
    case Max = 'max';

    public function label(): string
    {
        return match ($this) {
            self::None => 'No thinking',
            self::Standard => 'Think',
            self::Max => 'Think Max',
        };
    }
}
