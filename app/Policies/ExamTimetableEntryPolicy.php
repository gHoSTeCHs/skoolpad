<?php

namespace App\Policies;

use App\Models\ExamTimetableEntry;
use App\Models\User;

class ExamTimetableEntryPolicy
{
    public function view(User $user, ExamTimetableEntry $entry): bool
    {
        return $user->id === $entry->user_id;
    }

    public function update(User $user, ExamTimetableEntry $entry): bool
    {
        return $user->id === $entry->user_id;
    }

    public function delete(User $user, ExamTimetableEntry $entry): bool
    {
        return $user->id === $entry->user_id;
    }
}
