<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum TopicCoverageSource: string
{
    use HasSelectOptions;

    case SchemeDefault = 'scheme_default';
    case ParentReported = 'parent_reported';
    case AppActivity = 'app_activity';

    public function label(): string
    {
        return match ($this) {
            self::SchemeDefault => 'Scheme Default',
            self::ParentReported => 'Parent Reported',
            self::AppActivity => 'App Activity',
        };
    }
}
