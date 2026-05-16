<?php

namespace App\Policies;

use App\Models\Question;
use App\Models\User;

class QuestionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->isStaff();
    }

    public function view(User $user, Question $question): bool
    {
        return $user->role->isStaff();
    }

    public function create(User $user): bool
    {
        return $user->role->hasPermission('manage_questions')
            || $user->role->hasPermission('submit_questions');
    }

    public function update(User $user, ?Question $question = null): bool
    {
        return $user->role->hasPermission('manage_questions')
            || $user->role->hasPermission('manage_scoped_questions');
    }

    public function publish(User $user): bool
    {
        return $user->role->hasPermission('publish_content');
    }

    public function managePapers(User $user): bool
    {
        return $user->role->hasPermission('manage_questions');
    }

    public function manageContexts(User $user): bool
    {
        return $user->role->hasPermission('manage_questions');
    }

    public function manageAnswers(User $user): bool
    {
        return $user->role->hasPermission('manage_answers');
    }

    public function delete(User $user, ?Question $question = null): bool
    {
        return $user->role->hasPermission('manage_questions');
    }
}
