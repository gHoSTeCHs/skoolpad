<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\Paginates;
use App\Enums\CourseScope;
use App\Enums\Semester;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreInstitutionCourseRequest;
use App\Http\Requests\Admin\UpdateInstitutionCourseRequest;
use App\Models\Department;
use App\Models\Discipline;
use App\Models\Faculty;
use App\Models\Institution;
use App\Models\InstitutionCourse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
    use Paginates;

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', InstitutionCourse::class);

        $courses = InstitutionCourse::query()
            ->with(['institution:id,name,abbreviation', 'owningDepartment:id,name', 'discipline:id,name'])
            ->withCount('topicMappings')
            ->when($request->filled('institution_id'), fn ($q) => $q->where('institution_id', $request->string('institution_id')))
            ->when($request->filled('level'), fn ($q) => $q->where('level', $request->integer('level')))
            ->when($request->filled('semester'), fn ($q) => $q->where('semester', $request->string('semester')))
            ->when($request->filled('course_scope'), fn ($q) => $q->where('course_scope', $request->string('course_scope')))
            ->when($request->filled('search'), fn ($q) => $q->search($request->string('search')))
            ->tap(fn ($q) => $this->applySorting($q, $request, ['course_code', 'course_title', 'level', 'semester'], 'course_code', 'asc'))
            ->paginate(self::DEFAULT_PER_PAGE)
            ->withQueryString();

        $courses->through(fn ($course) => [
            'id' => $course->id,
            'course_code' => $course->course_code,
            'course_title' => $course->course_title,
            'institution' => $course->institution ? [
                'id' => $course->institution->id,
                'abbreviation' => $course->institution->abbreviation,
            ] : null,
            'owning_department' => $course->owningDepartment ? [
                'id' => $course->owningDepartment->id,
                'name' => $course->owningDepartment->name,
            ] : null,
            'level' => $course->level,
            'semester' => $course->semester->value,
            'credit_units' => $course->credit_units,
            'course_scope' => $course->course_scope->value,
            'course_scope_label' => $course->course_scope->label(),
            'topics_count' => $course->topic_mappings_count,
        ]);

        return Inertia::render('admin/courses/index', [
            'courses' => $this->paginated($courses),
            'institutions' => Institution::query()->orderBy('name')->get(['id', 'name', 'abbreviation']),
            'course_scopes' => CourseScope::toSelectOptions(),
            'filters' => $request->only(['search', 'institution_id', 'level', 'semester', 'course_scope', 'sort', 'direction']),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', InstitutionCourse::class);

        return Inertia::render('admin/courses/create', [
            'institutions' => Institution::query()->orderBy('name')->get(['id', 'name', 'abbreviation']),
            'disciplines' => Discipline::query()->orderBy('name')->get(['id', 'name']),
            'levels' => [100, 200, 300, 400, 500],
            'course_scopes' => CourseScope::toSelectOptions(),
            'semesters' => array_map(fn ($case) => [
                'value' => $case->value,
                'label' => $case->label(),
            ], Semester::cases()),
        ]);
    }

    public function store(StoreInstitutionCourseRequest $request): RedirectResponse
    {
        Gate::authorize('create', InstitutionCourse::class);

        $course = InstitutionCourse::query()->create($request->validated());

        return to_route('admin.courses.edit', $course)->with('success', 'Course created.');
    }

    public function edit(InstitutionCourse $course): Response
    {
        Gate::authorize('update', $course);

        $course->load(['institution', 'owningDepartment.faculty', 'discipline']);

        return Inertia::render('admin/courses/edit', [
            'course' => [
                'id' => $course->id,
                'institution_id' => $course->institution_id,
                'owning_department_id' => $course->owning_department_id,
                'discipline_id' => $course->discipline_id,
                'course_code' => $course->course_code,
                'course_title' => $course->course_title,
                'level' => $course->level,
                'semester' => $course->semester->value,
                'credit_units' => $course->credit_units,
                'is_elective' => $course->is_elective,
                'course_scope' => $course->course_scope->value,
                'description' => $course->description,
            ],
            'institutions' => Institution::query()->orderBy('name')->get(['id', 'name', 'abbreviation']),
            'disciplines' => Discipline::query()->orderBy('name')->get(['id', 'name']),
            'levels' => [100, 200, 300, 400, 500],
            'course_scopes' => CourseScope::toSelectOptions(),
            'semesters' => array_map(fn ($case) => [
                'value' => $case->value,
                'label' => $case->label(),
            ], Semester::cases()),
            'faculties' => Faculty::query()->where('institution_id', $course->institution_id)
                ->orderBy('name')
                ->get(['id', 'name']),
            'departments' => Department::query()->whereHas('faculty', fn ($q) => $q->where('institution_id', $course->institution_id))
                ->orderBy('name')
                ->get(['id', 'name', 'abbreviation', 'faculty_id']),
        ]);
    }

    public function update(UpdateInstitutionCourseRequest $request, InstitutionCourse $course): RedirectResponse
    {
        Gate::authorize('update', $course);

        $course->update($request->validated());

        return to_route('admin.courses.edit', $course)->with('success', 'Course updated.');
    }
}
