<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum EducationSystemType: string
{
    use HasSelectOptions;

    case National = 'national';
    case State = 'state';
    case International = 'international';
    case ExamBoard = 'exam_board';

    public function label(): string
    {
        return match ($this) {
            self::National => 'National',
            self::State => 'State',
            self::International => 'International',
            self::ExamBoard => 'Exam Board',
        };
    }
}
