<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum TeachingDepth: string
{
    use HasSelectOptions;

    case SurfaceMention = 'surface_mention';
    case Introductory = 'introductory';
    case Intermediate = 'intermediate';
    case Advanced = 'advanced';
    case Specialized = 'specialized';

    public function label(): string
    {
        return match ($this) {
            self::SurfaceMention => 'Surface Mention',
            self::Introductory => 'Introductory',
            self::Intermediate => 'Intermediate',
            self::Advanced => 'Advanced',
            self::Specialized => 'Specialized',
        };
    }
}
