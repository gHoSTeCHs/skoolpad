<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\Paginates;
use App\Enums\EducationSystemType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreEducationSystemRequest;
use App\Http\Requests\Admin\UpdateEducationSystemRequest;
use App\Models\Country;
use App\Models\Discipline;
use App\Models\EducationSystem;
use App\Models\GradingScale;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class EducationSystemController extends Controller
{
    use Paginates;

    public function index(Request $request): Response
    {
        $systems = EducationSystem::query()
            ->with('country:id,name,code')
            ->withCount(['curriculumTiers', 'streams', 'curriculumSubjects', 'assessmentTypes'])
            ->when($request->filled('search'), fn ($q) => $q->search($request->string('search')))
            ->when($request->filled('system_type'), fn ($q) => $q->where('system_type', $request->string('system_type')))
            ->tap(fn ($query) => $this->applySorting($query, $request, [
                'name', 'system_type', 'curriculum_tiers_count', 'curriculum_subjects_count',
            ]))
            ->paginate(self::DEFAULT_PER_PAGE)
            ->withQueryString();

        $systemsWithLabels = $systems->through(fn ($system) => array_merge(
            $system->toArray(),
            ['system_type_label' => $system->system_type->label()]
        ));

        return Inertia::render('admin/education-systems/index', [
            'educationSystems' => $this->paginated($systemsWithLabels),
            'filters' => $request->only(['search', 'system_type', 'sort', 'direction']),
            'systemTypes' => EducationSystemType::toSelectOptions(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/education-systems/create', [
            'systemTypes' => EducationSystemType::toSelectOptions(),
            'countries' => Country::orderBy('name')->get(['id', 'name', 'code']),
        ]);
    }

    public function store(StoreEducationSystemRequest $request): RedirectResponse
    {
        $data = $request->validated();
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        EducationSystem::create($data);

        return to_route('admin.education-systems.index')->with('success', 'Education system created successfully.');
    }

    public function show(EducationSystem $educationSystem): Response
    {
        $educationSystem->load([
            'country:id,name,code',
            'curriculumTiers' => fn ($q) => $q->orderBy('sort_order')->withCount('educationLevels'),
            'curriculumTiers.educationLevels' => fn ($q) => $q->orderBy('sort_order'),
            'streams.appliesFromTier:id,name',
            'curriculumSubjects' => fn ($q) => $q->orderBy('name'),
            'curriculumSubjects.discipline:id,name',
            'assessmentTypes' => fn ($q) => $q->orderBy('name'),
            'assessmentTypes.tier:id,name',
            'assessmentTypes.gradingScale:id,name',
            'assessmentTypes.assessmentSubjects' => fn ($q) => $q->orderBy('name'),
        ]);

        return Inertia::render('admin/education-systems/show', [
            'educationSystem' => $educationSystem,
            'disciplines' => Discipline::orderBy('name')->get(['id', 'name']),
            'gradingScales' => GradingScale::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function edit(EducationSystem $educationSystem): Response
    {
        return Inertia::render('admin/education-systems/edit', [
            'educationSystem' => $educationSystem,
            'systemTypes' => EducationSystemType::toSelectOptions(),
            'countries' => Country::orderBy('name')->get(['id', 'name', 'code']),
        ]);
    }

    public function update(UpdateEducationSystemRequest $request, EducationSystem $educationSystem): RedirectResponse
    {
        $educationSystem->update($request->validated());

        return to_route('admin.education-systems.show', $educationSystem)->with('success', 'Education system updated successfully.');
    }
}
