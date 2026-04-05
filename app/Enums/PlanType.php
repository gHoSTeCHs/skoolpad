<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum PlanType: string
{
    use HasSelectOptions;

    case Student = 'student';
    case Parent = 'parent';
    case Institution = 'institution';

    public function label(): string
    {
        return match ($this) {
            self::Student => 'Student',
            self::Parent => 'Parent',
            self::Institution => 'Institution',
        };
    }
}
