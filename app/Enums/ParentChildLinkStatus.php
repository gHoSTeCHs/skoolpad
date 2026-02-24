<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum ParentChildLinkStatus: string
{
    use HasSelectOptions;

    case Pending = 'pending';
    case Active = 'active';
    case Revoked = 'revoked';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Active => 'Active',
            self::Revoked => 'Revoked',
        };
    }
}
