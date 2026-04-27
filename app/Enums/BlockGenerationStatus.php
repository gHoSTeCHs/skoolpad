<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum BlockGenerationStatus: string
{
    use HasSelectOptions;

    case NotStarted = 'not_started';
    case Generated = 'generated';
    case Approved = 'approved';

    public function label(): string
    {
        return match ($this) {
            self::NotStarted => 'Not started',
            self::Generated => 'Generated',
            self::Approved => 'Approved',
        };
    }
}
