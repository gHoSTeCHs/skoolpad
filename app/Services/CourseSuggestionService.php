<?php

namespace App\Services;

use App\Enums\CourseScope;
use App\Models\InstitutionCourse;
use Illuminate\Database\Eloquent\Collection;

class CourseSuggestionService
{
    /**
     * @return Collection<int, InstitutionCourse>
     */
    public function getCoursesForStudent(
        string $institutionId,
        string $departmentId,
        int $level,
        ?string $semester = null,
    ): Collection {
        return InstitutionCourse::query()
            ->where('institution_id', $institutionId)
            ->where('level', $level)
            ->where(function ($query) use ($departmentId) {
                $query->where(function ($q) use ($departmentId) {
                    $q->where('course_scope', CourseScope::Department)
                        ->where('owning_department_id', $departmentId);
                })->orWhere(function ($q) use ($departmentId) {
                    $q->where('course_scope', CourseScope::Faculty)
                        ->whereIn('id', function ($sub) use ($departmentId) {
                            $sub->select('institution_course_id')
                                ->from('course_department_offerings')
                                ->where('department_id', $departmentId);
                        });
                })->orWhere('course_scope', CourseScope::InstitutionWide);
            })
            ->when($semester, fn ($q, $sem) => $q->where(function ($q) use ($sem) {
                $q->where('semester', $sem)->orWhere('semester', 'both');
            }))
            ->orderBy('course_code')
            ->get();
    }
}
