<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum InstitutionType: string
{
    use HasSelectOptions;

    case University = 'university';
    case Polytechnic = 'polytechnic';
    case CollegeOfEducation = 'college_of_education';
    case Monotechnic = 'monotechnic';

    public function label(): string
    {
        return match ($this) {
            self::University => 'University',
            self::Polytechnic => 'Polytechnic',
            self::CollegeOfEducation => 'College of Education',
            self::Monotechnic => 'Monotechnic',
        };
    }

    /** @return list<string> */
    public function degreeTypes(): array
    {
        return match ($this) {
            self::University => ['B.Sc', 'B.A', 'B.Eng', 'B.Tech'],
            self::Polytechnic => ['ND', 'HND'],
            self::CollegeOfEducation => ['NCE'],
            self::Monotechnic => ['ND', 'HND'],
        };
    }
}
