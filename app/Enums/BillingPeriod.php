<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum BillingPeriod: string
{
    use HasSelectOptions;

    case Monthly = 'monthly';
    case Semesterly = 'semesterly';
    case Yearly = 'yearly';

    public function label(): string
    {
        return match ($this) {
            self::Monthly => 'Monthly',
            self::Semesterly => 'Semesterly',
            self::Yearly => 'Yearly',
        };
    }
}
