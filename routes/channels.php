<?php

use App\Models\ContentProject;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Gate;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('content-studio.{contentProject}', function (User $user, ContentProject $contentProject) {
    return Gate::forUser($user)->allows('view', $contentProject);
});

Broadcast::channel('answers.{questionId}', function (User $user) {
    return $user->role->isStaff();
});
