<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum AIAdapterType: string
{
    use HasSelectOptions;

    case OpenAICompatible = 'openai_compatible';
    case Anthropic = 'anthropic';

    public function label(): string
    {
        return match ($this) {
            self::OpenAICompatible => 'OpenAI Compatible',
            self::Anthropic => 'Anthropic',
        };
    }
}
