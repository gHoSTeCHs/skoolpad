<?php

namespace App\Http\Controllers\Admin;

use App\Enums\CourseScope;
use App\Http\Controllers\Controller;
use App\Models\CourseDepartmentOffering;
use App\Models\Department;
use App\Models\Faculty;
use App\Models\InstitutionCourse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CourseDepartmentController extends Controller
{
    public function index(InstitutionCourse $course): Response
    {
        $course->load(['institution', 'owningDepartment', 'departmentOfferings']);

        $scopeType = match ($course->course_scope) {
            CourseScope::Department => 'department',
            CourseScope::InstitutionWide => 'institution_wide',
            CourseScope::Faculty => 'faculty',
        };

        $message = match ($course->course_scope) {
            CourseScope::Department => 'This course is department-scoped and is offered only within its owning department. No additional department configuration is needed.',
            CourseScope::InstitutionWide => 'This course is institution-wide and is automatically available to all departments. No additional department configuration is needed.',
            CourseScope::Faculty => null,
        };

        $faculties = [];

        if ($course->course_scope === CourseScope::Faculty) {
            $offeringMap = $course->departmentOfferings->pluck('is_compulsory', 'department_id');

            $faculties = Faculty::where('institution_id', $course->institution_id)
                ->with(['departments' => fn ($q) => $q->orderBy('name')])
                ->orderBy('name')
                ->get()
                ->map(fn (Faculty $faculty) => [
                    'id' => $faculty->id,
                    'name' => $faculty->name,
                    'departments' => $faculty->departments->map(fn (Department $dept) => [
                        'id' => $dept->id,
                        'name' => $dept->name,
                        'abbreviation' => $dept->abbreviation,
                        'is_offered' => $offeringMap->has($dept->id),
                        'is_compulsory' => (bool) $offeringMap->get($dept->id, false),
                    ])->values()->all(),
                ])->values()->all();
        }

        return Inertia::render('admin/courses/departments', [
            'course' => $this->basicCourseData($course),
            'scope_type' => $scopeType,
            'message' => $message,
            'faculties' => $faculties,
        ]);
    }

    public function update(Request $request, InstitutionCourse $course): RedirectResponse
    {
        if ($course->course_scope !== CourseScope::Faculty) {
            return back()->with('error', 'Department offerings can only be configured for faculty-scoped courses.');
        }

        $validated = $request->validate([
            'offerings' => ['present', 'array'],
            'offerings.*.department_id' => ['required', 'uuid'],
            'offerings.*.is_compulsory' => ['required', 'boolean'],
        ]);

        $departmentIds = collect($validated['offerings'])->pluck('department_id');

        $validDepartmentIds = Department::whereIn('id', $departmentIds)
            ->whereHas('faculty', fn ($q) => $q->where('institution_id', $course->institution_id))
            ->pluck('id');

        CourseDepartmentOffering::where('institution_course_id', $course->id)
            ->whereNotIn('department_id', $validDepartmentIds)
            ->delete();

        foreach ($validated['offerings'] as $offering) {
            if ($validDepartmentIds->contains($offering['department_id'])) {
                CourseDepartmentOffering::updateOrCreate(
                    [
                        'institution_course_id' => $course->id,
                        'department_id' => $offering['department_id'],
                    ],
                    [
                        'is_compulsory' => $offering['is_compulsory'],
                    ]
                );
            }
        }

        return back()->with('success', 'Department offerings updated.');
    }

    /** @return array<string, mixed> */
    private function basicCourseData(InstitutionCourse $course): array
    {
        return [
            'id' => $course->id,
            'course_code' => $course->course_code,
            'course_title' => $course->course_title,
            'course_scope' => $course->course_scope->value,
            'institution' => [
                'name' => $course->institution?->name,
            ],
        ];
    }
}
