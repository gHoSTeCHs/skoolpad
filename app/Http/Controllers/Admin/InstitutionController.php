<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\Paginates;
use App\Enums\InstitutionType;
use App\Enums\OwnershipType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreInstitutionRequest;
use App\Http\Requests\Admin\UpdateInstitutionRequest;
use App\Models\Country;
use App\Models\EducationSystem;
use App\Models\GradingScale;
use App\Models\Institution;
use App\Models\InstitutionType as InstitutionTypeModel;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class InstitutionController extends Controller
{
    use Paginates;

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Institution::class);

        $institutions = Institution::query()
            ->withCount('faculties')
            ->when($request->filled('search'), fn ($q) => $q->search($request->string('search')))
            ->when($request->filled('institution_type'), function ($query) use ($request) {
                $query->where('institution_type', $request->string('institution_type'));
            })
            ->when($request->filled('ownership_type'), function ($query) use ($request) {
                $query->where('ownership_type', $request->string('ownership_type'));
            })
            ->when($request->filled('is_active'), function ($query) use ($request) {
                $query->where('is_active', $request->boolean('is_active'));
            })
            ->tap(fn ($query) => $this->applySorting($query, $request, ['name', 'institution_type', 'ownership_type', 'state', 'is_active', 'faculties_count']))
            ->paginate(self::DEFAULT_PER_PAGE)
            ->withQueryString();

        $institutionsWithLabels = $institutions->through(fn ($institution) => array_merge(
            $institution->toArray(),
            [
                'institution_type_label' => $institution->institution_type->label(),
                'ownership_type_label' => $institution->ownership_type->label(),
            ]
        ));

        return Inertia::render('admin/institutions/index', [
            'institutions' => $this->paginated($institutionsWithLabels),
            'filters' => $request->only(['search', 'institution_type', 'ownership_type', 'is_active', 'sort', 'direction']),
            'institutionTypes' => InstitutionType::toSelectOptions(),
            'ownershipTypes' => OwnershipType::toSelectOptions(),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', Institution::class);

        return Inertia::render('admin/institutions/create', [
            'institutionTypes' => InstitutionType::toSelectOptions(),
            'institutionTypeModels' => InstitutionTypeModel::query()->orderBy('name')->get(['id', 'name']),
            'ownershipTypes' => OwnershipType::toSelectOptions(),
            'countries' => Country::query()->get(),
            'gradingScales' => GradingScale::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(StoreInstitutionRequest $request): RedirectResponse
    {
        Gate::authorize('create', Institution::class);

        $data = $request->validated();

        if ($request->hasFile('logo')) {
            $data['logo_path'] = $request->file('logo')->store('logos/institutions', 's3');
        }
        unset($data['logo']);

        Institution::query()->create($data);
        cache()->forget('ref.institutions.all');
        cache()->forget('ref.institutions.active');

        return to_route('admin.institutions.index')->with('success', 'Institution created successfully.');
    }

    public function show(Institution $institution): Response
    {
        Gate::authorize('view', $institution);

        $institution->load([
            'country:id,name',
            'institutionTypeModel:id,name',
            'educationSystems:id,name',
            'calendarTerms' => fn ($q) => $q->orderBy('academic_year', 'desc')->orderBy('sort_order'),
        ]);

        return Inertia::render('admin/institutions/show', [
            'institution' => $institution,
            'educationSystems' => EducationSystem::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function attachEducationSystem(\App\Http\Requests\Admin\AttachEducationSystemRequest $request, Institution $institution): RedirectResponse
    {
        Gate::authorize('update', $institution);

        $institution->educationSystems()->syncWithoutDetaching([$request->validated('education_system_id')]);

        return back()->with('success', 'Education system attached.');
    }

    public function detachEducationSystem(Institution $institution, EducationSystem $educationSystem): RedirectResponse
    {
        Gate::authorize('update', $institution);

        $institution->educationSystems()->detach($educationSystem->id);

        return back()->with('success', 'Education system detached.');
    }

    public function edit(Institution $institution): Response
    {
        Gate::authorize('update', $institution);

        return Inertia::render('admin/institutions/edit', [
            'institution' => $institution,
            'institutionTypes' => InstitutionType::toSelectOptions(),
            'institutionTypeModels' => InstitutionTypeModel::query()->orderBy('name')->get(['id', 'name']),
            'ownershipTypes' => OwnershipType::toSelectOptions(),
            'countries' => Country::query()->get(),
            'gradingScales' => GradingScale::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(UpdateInstitutionRequest $request, Institution $institution): RedirectResponse
    {
        Gate::authorize('update', $institution);

        $data = $request->validated();

        if ($request->hasFile('logo')) {
            if ($institution->logo_path) {
                Storage::disk('s3')->delete($institution->logo_path);
            }
            $data['logo_path'] = $request->file('logo')->store('logos/institutions', 's3');
        }
        unset($data['logo']);

        $institution->update($data);
        cache()->forget('ref.institutions.all');
        cache()->forget('ref.institutions.active');

        return to_route('admin.institutions.index')->with('success', 'Institution updated successfully.');
    }
}
