<?php

namespace App\Policies;

use App\Models\User;

class ImportPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->hasPermission('manage_bulk_imports');
    }

    public function import(User $user): bool
    {
        return $user->role->hasPermission('manage_bulk_imports');
    }
}
