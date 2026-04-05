<?php

namespace App\Policies;

use App\Models\User;

class ContentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->hasPermission('manage_canonical_topics');
    }

    public function create(User $user): bool
    {
        return $user->role->hasPermission('manage_canonical_topics');
    }

    public function update(User $user): bool
    {
        return $user->role->hasPermission('manage_canonical_topics');
    }

    public function delete(User $user): bool
    {
        return $user->role->hasPermission('manage_canonical_topics');
    }

    public function publish(User $user): bool
    {
        return $user->role->hasPermission('publish_content');
    }
}
