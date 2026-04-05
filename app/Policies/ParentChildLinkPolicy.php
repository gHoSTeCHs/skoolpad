<?php

namespace App\Policies;

use App\Models\ParentChildLink;
use App\Models\User;

class ParentChildLinkPolicy
{
    public function revoke(User $user, ParentChildLink $link): bool
    {
        $isParentOwner = $user->parentProfile
            && $link->parent_profile_id === $user->parentProfile->id;

        $isStudentOwner = $user->studentProfile
            && $link->student_profile_id === $user->studentProfile->id;

        return $isParentOwner || $isStudentOwner;
    }
}
