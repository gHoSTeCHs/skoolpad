<?php

namespace App\Policies;

use App\Models\User;

class UserManagementPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->hasPermission('manage_all_users');
    }

    public function view(User $user, User $model): bool
    {
        return $user->role->hasPermission('manage_all_users');
    }

    public function update(User $user, User $model): bool
    {
        return $user->role->hasPermission('manage_all_users');
    }
}
