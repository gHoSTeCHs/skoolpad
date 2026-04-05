<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum QuestionStatus: string
{
    use HasSelectOptions;
    case Draft = 'draft';
    case InReview = 'in_review';
    case Published = 'published';
    case Archived = 'archived';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::InReview => 'In Review',
            self::Published => 'Published',
            self::Archived => 'Archived',
        };
    }

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
