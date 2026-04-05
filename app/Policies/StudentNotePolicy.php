<?php

namespace App\Policies;

use App\Models\StudentNote;
use App\Models\User;

class StudentNotePolicy
{
    public function view(User $user, StudentNote $note): bool
    {
        return $user->id === $note->user_id;
    }

    public function update(User $user, StudentNote $note): bool
    {
        return $user->id === $note->user_id;
    }

    public function delete(User $user, StudentNote $note): bool
    {
        return $user->id === $note->user_id;
    }
}
