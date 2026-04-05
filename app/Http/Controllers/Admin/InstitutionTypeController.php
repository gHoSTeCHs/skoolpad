<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\Paginates;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreInstitutionTypeRequest;
use App\Http\Requests\Admin\UpdateInstitutionTypeRequest;
use App\Models\Country;
use App\Models\GradingScale;
use App\Models\Institution;
use App\Models\InstitutionType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class InstitutionTypeController extends Controller
{
    use Paginates;

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Institution::class);

        $types = InstitutionType::query()
            ->with(['country:id,name', 'gradingScale:id,name'])
            ->when($request->filled('search'), fn ($q) => $q->search($request->string('search')))
            ->tap(fn ($query) => $this->applySorting($query, $request, ['name', 'credit_system']))
            ->paginate(self::DEFAULT_PER_PAGE)
            ->withQueryString();

        return Inertia::render('admin/institution-types/index', [
            'institutionTypes' => $this->paginated($types),
            'filters' => $request->only(['search', 'sort', 'direction']),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', Institution::class);

        return Inertia::render('admin/institution-types/create', [
            'countries' => Country::query()->orderBy('name')->get(['id', 'name']),
            'gradingScales' => GradingScale::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(StoreInstitutionTypeRequest $request): RedirectResponse
    {
        Gate::authorize('create', Institution::class);

        $data = $request->validated();
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        InstitutionType::query()->create($data);

        return to_route('admin.institution-types.index')->with('success', 'Institution type created successfully.');
    }

    public function edit(InstitutionType $institutionType): Response
    {
        Gate::authorize('update', Institution::class);

        $institutionType->load(['country:id,name', 'gradingScale:id,name']);

        return Inertia::render('admin/institution-types/edit', [
            'institutionType' => $institutionType,
            'countries' => Country::query()->orderBy('name')->get(['id', 'name']),
            'gradingScales' => GradingScale::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(UpdateInstitutionTypeRequest $request, InstitutionType $institutionType): RedirectResponse
    {
        Gate::authorize('update', Institution::class);

        $institutionType->update($request->validated());

        return to_route('admin.institution-types.index')->with('success', 'Institution type updated successfully.');
    }
}
