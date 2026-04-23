<?php

namespace App\Policies;

use App\Models\ContentProject;
use App\Models\User;

class ContentProjectPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->hasPermission('manage_content');
    }

    public function view(User $user, ContentProject $project): bool
    {
        return $user->role->hasPermission('manage_content');
    }

    public function create(User $user): bool
    {
        return $user->role->hasPermission('manage_content');
    }

    public function update(User $user, ContentProject $project): bool
    {
        return $user->role->hasPermission('manage_content');
    }

    public function delete(User $user, ContentProject $project): bool
    {
        return $user->role->hasPermission('manage_content');
    }
}
