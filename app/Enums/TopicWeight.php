<?php

namespace App\Enums;

enum TopicWeight: string
{
    case Core = 'core';
    case Supplementary = 'supplementary';
    case Optional = 'optional';

    public function label(): string
    {
        return match ($this) {
            self::Core => 'Core',
            self::Supplementary => 'Supplementary',
            self::Optional => 'Optional',
        };
    }
}
