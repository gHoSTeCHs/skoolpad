<?php

namespace App\Policies;

use App\Models\User;

class SubscriptionPolicy
{
    public function viewPlans(User $user): bool
    {
        return $user->role->hasPermission('manage_subscriptions');
    }

    public function updatePlan(User $user): bool
    {
        return $user->role->hasPermission('manage_subscriptions');
    }

    public function viewSettings(User $user): bool
    {
        return $user->role->hasPermission('manage_platform_settings');
    }

    public function updateSettings(User $user): bool
    {
        return $user->role->hasPermission('manage_platform_settings');
    }
}
