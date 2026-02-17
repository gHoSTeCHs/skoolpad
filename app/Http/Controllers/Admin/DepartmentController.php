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

    public function index(Request $request, Faculty $faculty): Response
    {
        $faculty->load('institution:id,name,abbreviation');

        $departments = Department::query()
            ->where('faculty_id', $faculty->id)
            ->when($request->filled('search'), function ($query) use ($request) {
                $query->where('name', 'like', "%{$request->string('search')}%");
            })
            ->tap(fn ($query) => $this->applySorting($query, $request, ['name']))
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/departments/index', [
            'departments' => $this->paginated($departments),
            'filters' => $request->only(['search', 'sort', 'direction']),
            'faculty' => [
                'id' => $faculty->id,
                'name' => $faculty->name,
                'abbreviation' => $faculty->abbreviation,
                'institution' => $faculty->institution?->only('id', 'name', 'abbreviation'),
            ],
        ]);
    }

    public function create(Faculty $faculty): Response
    {
        $faculty->load('institution:id,name,abbreviation');

        return Inertia::render('admin/departments/create', [
            'faculty' => [
                'id' => $faculty->id,
                'name' => $faculty->name,
                'abbreviation' => $faculty->abbreviation,
                'institution' => $faculty->institution?->only('id', 'name', 'abbreviation'),
            ],
        ]);
    }

    public function store(StoreDepartmentRequest $request, Faculty $faculty): RedirectResponse
    {
        $faculty->departments()->create($request->validated());

        return to_route('admin.departments.index', $faculty)->with('success', 'Department created successfully.');
    }

    public function edit(Department $department): Response
    {
        $department->load('faculty:id,name,institution_id', 'faculty.institution:id,name,abbreviation');

        return Inertia::render('admin/departments/edit', [
            'department' => $department,
        ]);
    }

    public function update(UpdateDepartmentRequest $request, Department $department): RedirectResponse
    {
        $department->update($request->validated());

        return to_route('admin.departments.index', $department->faculty_id)->with('success', 'Department updated successfully.');
    }
}
