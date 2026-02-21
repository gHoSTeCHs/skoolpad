<?php

namespace App\Enums;

enum AnswerDepthLevel: string
{
    case Quick = 'quick';
    case Standard = 'standard';
    case DeepDive = 'deep_dive';

    public function label(): string
    {
        return match ($this) {
            self::Quick => 'Quick',
            self::Standard => 'Standard',
            self::DeepDive => 'Deep Dive',
        };
    }

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function description(): string
    {
        return match ($this) {
            self::Quick => '1-2 sentence direct answer. Available to Free tier.',
            self::Standard => 'Step-by-step explanation with reasoning. Available to Scholar tier.',
            self::DeepDive => 'Comprehensive explanation with examples, diagrams, related concepts. Available to Scholar Pro tier.',
        };
    }
}
