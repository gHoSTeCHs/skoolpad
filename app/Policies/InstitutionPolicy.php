<?php

namespace App\Policies;

use App\Models\User;

class InstitutionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->hasPermission('manage_institutions');
    }

    public function create(User $user): bool
    {
        return $user->role->hasPermission('manage_institutions');
    }

    public function update(User $user): bool
    {
        return $user->role->hasPermission('manage_institutions');
    }

    public function delete(User $user): bool
    {
        return $user->role->hasPermission('manage_institutions');
    }
}
