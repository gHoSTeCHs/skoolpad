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
    public function index(Request $request): Response
    {
        $faculties = Faculty::query()
            ->with('institution:id,name,abbreviation')
            ->withCount('departments')
            ->when($request->filled('search'), function ($query) use ($request) {
                $query->where('name', 'like', "%{$request->string('search')}%");
            })
            ->when($request->filled('institution_id'), function ($query) use ($request) {
                $query->where('institution_id', $request->string('institution_id'));
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/faculties/index', [
            'faculties' => $this->paginated($faculties),
            'filters' => $request->only(['search', 'institution_id']),
            'institutions' => Institution::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/faculties/create', [
            'institutions' => Institution::select('id', 'name', 'abbreviation')->orderBy('name')->get(),
        ]);
    }

    public function store(StoreFacultyRequest $request): RedirectResponse
    {
        Faculty::create($request->validated());

        return to_route('admin.faculties.index')->with('success', 'Faculty created successfully.');
    }

    public function edit(Faculty $faculty): Response
    {
        $faculty->load('institution:id,name');

        return Inertia::render('admin/faculties/edit', [
            'faculty' => $faculty,
            'institutions' => Institution::select('id', 'name', 'abbreviation')->orderBy('name')->get(),
        ]);
    }

    public function update(UpdateFacultyRequest $request, Faculty $faculty): RedirectResponse
    {
        $faculty->update($request->validated());

        return to_route('admin.faculties.index')->with('success', 'Faculty updated successfully.');
    }
}
