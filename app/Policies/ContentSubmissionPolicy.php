<?php

namespace App\Policies;

use App\Models\ContentSubmission;
use App\Models\User;

class ContentSubmissionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->hasPermission('review_submissions');
    }

    public function review(User $user, ContentSubmission $submission): bool
    {
        return $user->role->hasPermission('review_submissions');
    }
}
