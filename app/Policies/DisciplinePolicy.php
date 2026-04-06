<?php

namespace App\Policies;

use App\Models\User;

class DisciplinePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->hasPermission('manage_disciplines');
    }

    public function create(User $user): bool
    {
        return $user->role->hasPermission('manage_disciplines');
    }

    public function update(User $user): bool
    {
        return $user->role->hasPermission('manage_disciplines');
    }

    public function delete(User $user): bool
    {
        return $user->role->hasPermission('manage_disciplines');
    }
}
