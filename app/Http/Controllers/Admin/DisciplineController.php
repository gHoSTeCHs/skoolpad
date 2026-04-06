<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\Paginates;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDisciplineRequest;
use App\Http\Requests\Admin\UpdateDisciplineRequest;
use App\Models\Discipline;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DisciplineController extends Controller
{
    use Paginates;

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Discipline::class);

        $disciplines = Discipline::query()
            ->withCount('canonicalTopics')
            ->when($request->filled('search'), fn ($q) => $q->search($request->string('search')))
            ->tap(fn ($query) => $this->applySorting($query, $request, ['name', 'canonical_topics_count']))
            ->paginate(self::DEFAULT_PER_PAGE)
            ->withQueryString();

        return Inertia::render('admin/disciplines/index', [
            'disciplines' => $this->paginated($disciplines),
            'filters' => $request->only(['search', 'sort', 'direction']),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', Discipline::class);

        return Inertia::render('admin/disciplines/create');
    }

    public function store(StoreDisciplineRequest $request): RedirectResponse
    {
        Gate::authorize('create', Discipline::class);

        $data = $request->validated();
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        Discipline::query()->create($data);
        cache()->forget('ref.disciplines');

        return to_route('admin.disciplines.index')->with('success', 'Discipline created successfully.');
    }

    public function edit(Discipline $discipline): Response
    {
        Gate::authorize('update', $discipline);

        return Inertia::render('admin/disciplines/edit', [
            'discipline' => $discipline,
        ]);
    }

    public function update(UpdateDisciplineRequest $request, Discipline $discipline): RedirectResponse
    {
        Gate::authorize('update', $discipline);

        $discipline->update($request->validated());
        cache()->forget('ref.disciplines');

        return to_route('admin.disciplines.index')->with('success', 'Discipline updated successfully.');
    }
}
