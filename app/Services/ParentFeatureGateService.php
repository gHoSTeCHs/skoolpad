<?php

namespace App\Services;

use App\Models\User;

class ParentFeatureGateService
{
    public function isMonetizationEnabled(): bool
    {
        return (bool) config('skoolpad.monetization_enabled', false);
    }

    public function isPremium(User $user): bool
    {
        if (! $this->isMonetizationEnabled()) {
            return true;
        }

        return $user->activeSubscription !== null;
    }

    public function getSubscriptionStatus(User $user): string
    {
        if (! $this->isMonetizationEnabled()) {
            return 'all_access';
        }

        return $user->activeSubscription?->plan?->name ?? 'free';
    }

    public function canAccessFullDashboard(User $user): bool
    {
        return $this->isPremium($user);
    }

    public function canAccessVerification(User $user): bool
    {
        return $this->isPremium($user);
    }

    public function canAccessReadTogether(User $user): bool
    {
        return $this->isPremium($user);
    }

    public function canAccessStudyAsChild(User $user): bool
    {
        return $this->isPremium($user);
    }

    public function canAccessWeeklyReport(User $user): bool
    {
        return $this->isPremium($user);
    }

    public function canAccessExamAlerts(User $user): bool
    {
        return $this->isPremium($user);
    }

    public function getCheckInTopicLimit(User $user): int
    {
        if ($this->isPremium($user)) {
            return PHP_INT_MAX;
        }

        return 1;
    }

    /** @return array<string, mixed> */
    public function getFeatureMatrix(User $user): array
    {
        $premium = $this->isPremium($user);

        return [
            'is_premium' => $premium,
            'full_dashboard' => $premium,
            'verification' => $premium,
            'read_together' => $premium,
            'study_as_child' => $premium,
            'weekly_report' => $premium,
            'exam_alerts' => $premium,
            'full_check_in' => $premium,
            'check_in_topic_limit' => $premium ? null : 1,
        ];
    }
}
