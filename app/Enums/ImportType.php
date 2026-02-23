<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum ImportType: string
{
    use HasSelectOptions;
    case Topics = 'topics';
    case CourseMappings = 'course_mappings';
    case CourseOfferings = 'course_offerings';
    case Questions = 'questions';

    public function label(): string
    {
        return match ($this) {
            self::Topics => 'Topics',
            self::CourseMappings => 'Course Mappings',
            self::CourseOfferings => 'Course Offerings',
            self::Questions => 'Questions',
        };
    }

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
