<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum PaymentStatus: string
{
    use HasSelectOptions;

    case Pending = 'pending';
    case Success = 'success';
    case Failed = 'failed';
    case Abandoned = 'abandoned';
    case Refunded = 'refunded';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Success => 'Success',
            self::Failed => 'Failed',
            self::Abandoned => 'Abandoned',
            self::Refunded => 'Refunded',
        };
    }
}
