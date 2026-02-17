<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\Paginates;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDisciplineRequest;
use App\Http\Requests\Admin\UpdateDisciplineRequest;
use App\Models\Discipline;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DisciplineController extends Controller
{
    use Paginates;

    public function index(Request $request): Response
    {
        $disciplines = Discipline::query()
            ->withCount('canonicalTopics')
            ->when($request->filled('search'), function ($query) use ($request) {
                $query->where('name', 'ilike', "%{$request->string('search')}%");
            })
            ->tap(fn ($query) => $this->applySorting($query, $request, ['name', 'canonical_topics_count']))
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/disciplines/index', [
            'disciplines' => $this->paginated($disciplines),
            'filters' => $request->only(['search', 'sort', 'direction']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/disciplines/create');
    }

    public function store(StoreDisciplineRequest $request): RedirectResponse
    {
        $data = $request->validated();
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        Discipline::create($data);

        return to_route('admin.disciplines.index')->with('success', 'Discipline created successfully.');
    }

    public function edit(Discipline $discipline): Response
    {
        return Inertia::render('admin/disciplines/edit', [
            'discipline' => $discipline,
        ]);
    }

    public function update(UpdateDisciplineRequest $request, Discipline $discipline): RedirectResponse
    {
        $discipline->update($request->validated());

        return to_route('admin.disciplines.index')->with('success', 'Discipline updated successfully.');
    }
}
