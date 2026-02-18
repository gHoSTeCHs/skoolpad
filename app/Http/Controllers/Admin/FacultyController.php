<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\Paginates;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreFacultyRequest;
use App\Http\Requests\Admin\UpdateFacultyRequest;
use App\Models\Faculty;
use App\Models\Institution;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FacultyController extends Controller
{
    use Paginates;

    public function index(Request $request, Institution $institution): Response
    {
        $faculties = Faculty::query()
            ->where('institution_id', $institution->id)
            ->withCount('departments')
            ->when($request->filled('search'), function ($query) use ($request) {
                $query->where('name', 'ilike', "%{$request->string('search')}%");
            })
            ->tap(fn ($query) => $this->applySorting($query, $request, ['name', 'departments_count']))
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/faculties/index', [
            'faculties' => $this->paginated($faculties),
            'filters' => $request->only(['search', 'sort', 'direction']),
            'institution' => $institution->only('id', 'name', 'abbreviation'),
        ]);
    }

    public function create(Institution $institution): Response
    {
        return Inertia::render('admin/faculties/create', [
            'institution' => $institution->only('id', 'name', 'abbreviation'),
        ]);
    }

    public function store(StoreFacultyRequest $request, Institution $institution): RedirectResponse
    {
        $institution->faculties()->create($request->validated());

        return to_route('admin.faculties.index', $institution)->with('success', 'Faculty created successfully.');
    }

    public function edit(Faculty $faculty): Response
    {
        $faculty->load('institution:id,name,abbreviation');

        return Inertia::render('admin/faculties/edit', [
            'faculty' => $faculty,
        ]);
    }

    public function update(UpdateFacultyRequest $request, Faculty $faculty): RedirectResponse
    {
        $faculty->update($request->validated());

        return to_route('admin.faculties.index', $faculty->institution_id)->with('success', 'Faculty updated successfully.');
    }
}
