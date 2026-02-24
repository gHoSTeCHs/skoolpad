<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum ScaleType: string
{
    use HasSelectOptions;

    case Cgpa = 'cgpa';
    case Gpa = 'gpa';
    case Percentage = 'percentage';
    case Letter = 'letter';
    case Points = 'points';
    case Classification = 'classification';

    public function label(): string
    {
        return match ($this) {
            self::Cgpa => 'CGPA',
            self::Gpa => 'GPA',
            self::Percentage => 'Percentage',
            self::Letter => 'Letter',
            self::Points => 'Points',
            self::Classification => 'Classification',
        };
    }
}
