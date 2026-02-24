<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum VerificationResult: string
{
    use HasSelectOptions;

    case Understood = 'understood';
    case PartiallyUnderstood = 'partially_understood';
    case NeedsReview = 'needs_review';

    public function label(): string
    {
        return match ($this) {
            self::Understood => 'Understood',
            self::PartiallyUnderstood => 'Partially Understood',
            self::NeedsReview => 'Needs Review',
        };
    }
}
