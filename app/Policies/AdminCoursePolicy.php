<?php

namespace App\Policies;

use App\Models\InstitutionCourse;
use App\Models\User;

class AdminCoursePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->hasPermission('manage_courses');
    }

    public function create(User $user): bool
    {
        return $user->role->hasPermission('manage_courses');
    }

    public function update(User $user, ?InstitutionCourse $course = null): bool
    {
        return $user->role->hasPermission('manage_courses');
    }

    public function manageMappings(User $user): bool
    {
        return $user->role->hasPermission('manage_course_mappings');
    }
}
