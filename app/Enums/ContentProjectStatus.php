<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum ContentProjectStatus: string
{
    use HasSelectOptions;

    case Draft = 'draft';
    case Research = 'research';
    case Structuring = 'structuring';
    case Generating = 'generating';
    case Reviewing = 'reviewing';
    case Complete = 'complete';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Research => 'Research',
            self::Structuring => 'Structuring',
            self::Generating => 'Generating',
            self::Reviewing => 'Reviewing',
            self::Complete => 'Complete',
        };
    }
}
