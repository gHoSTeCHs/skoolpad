<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum TopicCoverageStatus: string
{
    use HasSelectOptions;

    case NotYetCovered = 'not_yet_covered';
    case Covered = 'covered';
    case Skipped = 'skipped';

    public function label(): string
    {
        return match ($this) {
            self::NotYetCovered => 'Not Yet Covered',
            self::Covered => 'Covered',
            self::Skipped => 'Skipped',
        };
    }
}
