<?php

namespace App\Services;

use App\Enums\AnswerDepthLevel;
use App\Models\User;

class AnswerDepthService
{
    /** @return array<int, AnswerDepthLevel> */
    public function getAvailableDepths(User $user): array
    {
        if (! $this->isMonetizationEnabled()) {
            return [AnswerDepthLevel::Quick];
        }

        $plan = $user->activeSubscription?->plan?->name ?? 'free';

        return match ($plan) {
            'free' => [AnswerDepthLevel::Quick],
            'scholar' => [AnswerDepthLevel::Quick, AnswerDepthLevel::Standard],
            'scholar-pro' => [AnswerDepthLevel::Quick, AnswerDepthLevel::Standard, AnswerDepthLevel::DeepDive],
            default => [AnswerDepthLevel::Quick],
        };
    }

    public function isMonetizationEnabled(): bool
    {
        return (bool) config('skoolpad.monetization_enabled', false);
    }

    public function canAccessDepth(User $user, AnswerDepthLevel $depth): bool
    {
        return in_array($depth, $this->getAvailableDepths($user));
    }
}
