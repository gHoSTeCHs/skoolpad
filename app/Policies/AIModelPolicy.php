<?php

namespace App\Policies;

use App\Models\AIModel;
use App\Models\User;

class AIModelPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->hasPermission('manage_content');
    }

    public function view(User $user, AIModel $aiModel): bool
    {
        return $user->role->hasPermission('manage_content');
    }

    public function create(User $user): bool
    {
        return $user->role->hasPermission('manage_content');
    }

    public function update(User $user, AIModel $aiModel): bool
    {
        return $user->role->hasPermission('manage_content');
    }

    public function delete(User $user, AIModel $aiModel): bool
    {
        return $user->role->hasPermission('manage_content');
    }
}
