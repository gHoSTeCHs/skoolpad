<?php

namespace App\Enums;

enum TopicDifficulty: string
{
    case Foundational = 'foundational';
    case Intermediate = 'intermediate';
    case Advanced = 'advanced';

    public function label(): string
    {
        return match ($this) {
            self::Foundational => 'Foundational',
            self::Intermediate => 'Intermediate',
            self::Advanced => 'Advanced',
        };
    }
}
