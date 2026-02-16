<?php

namespace App\Enums;

enum PracticeMode: string
{
    case Timed = 'timed';
    case Untimed = 'untimed';
    case Review = 'review';

    public function label(): string
    {
        return match ($this) {
            self::Timed => 'Timed',
            self::Untimed => 'Untimed',
            self::Review => 'Review',
        };
    }
}
