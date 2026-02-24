<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum BloomLevel: string
{
    use HasSelectOptions;

    case Remember = 'remember';
    case Understand = 'understand';
    case Apply = 'apply';
    case Analyze = 'analyze';
    case Evaluate = 'evaluate';
    case Create = 'create';

    public function label(): string
    {
        return match ($this) {
            self::Remember => 'Remember',
            self::Understand => 'Understand',
            self::Apply => 'Apply',
            self::Analyze => 'Analyze',
            self::Evaluate => 'Evaluate',
            self::Create => 'Create',
        };
    }
}
