<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum SubscriptionStatus: string
{
    use HasSelectOptions;

    case Active = 'active';
    case PastDue = 'past_due';
    case Paused = 'paused';
    case Cancelled = 'cancelled';
    case Expired = 'expired';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Active',
            self::PastDue => 'Past Due',
            self::Paused => 'Paused',
            self::Cancelled => 'Cancelled',
            self::Expired => 'Expired',
        };
    }
}
