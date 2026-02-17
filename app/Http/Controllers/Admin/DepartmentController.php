<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\Paginates;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDepartmentRequest;
use App\Http\Requests\Admin\UpdateDepartmentRequest;
use App\Models\Department;
use App\Models\Faculty;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentController extends Controller
{
    use Paginates;

    public function index(Request $request): Response
    {
        $departments = Department::query()
            ->with('faculty:id,name,institution_id', 'faculty.institution:id,name')
            ->when($request->filled('search'), function ($query) use ($request) {
                $query->where('name', 'like', "%{$request->string('search')}%");
            })
            ->when($request->filled('faculty_id'), function ($query) use ($request) {
                $query->where('faculty_id', $request->string('faculty_id'));
            })
            ->tap(fn ($query) => $this->applySorting($query, $request, ['name']))
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/departments/index', [
            'departments' => $this->paginated($departments),
            'filters' => $request->only(['search', 'faculty_id', 'sort', 'direction']),
            'faculties' => Faculty::with('institution:id,name')->select('id', 'name', 'institution_id')->orderBy('name')->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/departments/create', [
            'faculties' => Faculty::with('institution:id,name')->select('id', 'name', 'institution_id')->orderBy('name')->get(),
        ]);
    }

    public function store(StoreDepartmentRequest $request): RedirectResponse
    {
        Department::create($request->validated());

        return to_route('admin.departments.index')->with('success', 'Department created successfully.');
    }

    public function edit(Department $department): Response
    {
        $department->load('faculty:id,name,institution_id', 'faculty.institution:id,name');

        return Inertia::render('admin/departments/edit', [
            'department' => $department,
            'faculties' => Faculty::with('institution:id,name')->select('id', 'name', 'institution_id')->orderBy('name')->get(),
        ]);
    }

    public function update(UpdateDepartmentRequest $request, Department $department): RedirectResponse
    {
        $department->update($request->validated());

        return to_route('admin.departments.index')->with('success', 'Department updated successfully.');
    }
}
