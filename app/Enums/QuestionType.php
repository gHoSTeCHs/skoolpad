<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum QuestionType: string
{
    use HasSelectOptions;

    case Mcq = 'mcq';
    case MultiSelectMcq = 'multi_select_mcq';
    case Theory = 'theory';
    case ShortAnswer = 'short_answer';
    case Essay = 'essay';
    case FillBlank = 'fill_blank';
    case Cloze = 'cloze';
    case Matching = 'matching';
    case Ordering = 'ordering';
    case TrueFalse = 'true_false';
    case DiagramLabel = 'diagram_label';
    case Calculation = 'calculation';
    case AssertionReason = 'assertion_reason';
    case MatrixMatching = 'matrix_matching';
    case NumericEntry = 'numeric_entry';
    case Group = 'group';

    public function label(): string
    {
        return match ($this) {
            self::Mcq => 'MCQ',
            self::MultiSelectMcq => 'Multi-Select MCQ',
            self::Theory => 'Theory',
            self::ShortAnswer => 'Short Answer',
            self::Essay => 'Essay',
            self::FillBlank => 'Fill in Blank',
            self::Cloze => 'Cloze',
            self::Matching => 'Matching',
            self::Ordering => 'Ordering',
            self::TrueFalse => 'True / False',
            self::DiagramLabel => 'Diagram Label',
            self::Calculation => 'Calculation',
            self::AssertionReason => 'Assertion & Reason',
            self::MatrixMatching => 'Matrix Matching',
            self::NumericEntry => 'Numeric Entry',
            self::Group => 'Group',
        };
    }

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
