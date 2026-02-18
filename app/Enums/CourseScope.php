<?php

namespace App\Enums;

enum CourseScope: string
{
    case Department = 'department';
    case Faculty = 'faculty';
    case InstitutionWide = 'institution_wide';

    public function label(): string
    {
        return match ($this) {
            self::Department => 'Department',
            self::Faculty => 'Faculty',
            self::InstitutionWide => 'Institution Wide',
        };
    }

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
