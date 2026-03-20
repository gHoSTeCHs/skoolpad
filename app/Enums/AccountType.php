<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum AccountType: string
{
    use HasSelectOptions;

    case Student = 'student';
    case Parent = 'parent';

    public function label(): string
    {
        return match ($this) {
            self::Student => 'Student',
            self::Parent => 'Parent',
        };
    }
}
