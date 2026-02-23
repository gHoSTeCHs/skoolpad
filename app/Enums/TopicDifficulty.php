<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum TopicDifficulty: string
{
    use HasSelectOptions;
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

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
