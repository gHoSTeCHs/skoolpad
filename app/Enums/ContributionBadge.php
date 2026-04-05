<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum ContributionBadge: string
{
    use HasSelectOptions;
    case None = 'none';
    case Contributor = 'contributor';
    case VerifiedContributor = 'verified_contributor';
    case TopContributor = 'top_contributor';

    public function label(): string
    {
        return match ($this) {
            self::None => 'None',
            self::Contributor => 'Contributor',
            self::VerifiedContributor => 'Verified Contributor',
            self::TopContributor => 'Top Contributor',
        };
    }
}
