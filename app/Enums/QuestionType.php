<?php

namespace App\Enums;

enum QuestionType: string
{
    case Mcq = 'mcq';
    case Theory = 'theory';
    case FillInBlank = 'fill_in_blank';

    public function label(): string
    {
        return match ($this) {
            self::Mcq => 'MCQ',
            self::Theory => 'Theory',
            self::FillInBlank => 'Fill in Blank',
        };
    }
}
