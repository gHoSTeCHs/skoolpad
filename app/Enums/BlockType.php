<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum BlockType: string
{
    use HasSelectOptions;

    case Container = 'container';
    case Text = 'text';
    case Code = 'code';
    case Diagram = 'diagram';
    case Example = 'example';
    case Exercise = 'exercise';
    case Quiz = 'quiz';
    case Reference = 'reference';
    case Comparison = 'comparison';

    public function label(): string
    {
        return match ($this) {
            self::Container => 'Container',
            self::Text => 'Text',
            self::Code => 'Code',
            self::Diagram => 'Diagram',
            self::Example => 'Example',
            self::Exercise => 'Exercise',
            self::Quiz => 'Quiz',
            self::Reference => 'Reference',
            self::Comparison => 'Comparison',
        };
    }
}
