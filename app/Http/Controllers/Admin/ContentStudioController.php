<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\Paginates;
use App\Enums\ContentProjectMode;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreContentProjectRequest;
use App\Models\ContentProject;
use App\Models\CurriculumSubject;
use App\Models\Discipline;
use App\Models\EducationLevel;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ContentStudioController extends Controller
{
    use Paginates;

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', ContentProject::class);

        $projects = ContentProject::query()
            ->with(['educationLevel', 'curriculumSubject', 'discipline', 'createdBy'])
            ->when($request->filled('mode'), fn ($q) => $q->where('mode', $request->string('mode')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->latest()
            ->paginate(self::DEFAULT_PER_PAGE)
            ->withQueryString();

        $projectsWithLabels = $projects->through(function ($project) {
            $data = $project->toArray();
            unset($data['education_level'], $data['curriculum_subject'], $data['discipline'], $data['created_by'], $data['ai_context']);

            return array_merge($data, [
                'created_by' => $project->getAttributeValue('created_by'),
                'mode_label' => $project->mode->label(),
                'status_label' => $project->status->label(),
                'education_level_name' => $project->educationLevel?->display_name ?? $project->educationLevel?->name,
                'curriculum_subject_name' => $project->curriculumSubject?->name,
                'discipline_name' => $project->discipline?->name,
                'created_by_name' => $project->createdBy?->name,
            ]);
        });

        return Inertia::render('admin/content-studio/index', [
            'projects' => $this->paginated($projectsWithLabels),
            'filters' => $request->only(['mode', 'status']),
            'modeOptions' => ContentProjectMode::toSelectOptions(),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', ContentProject::class);

        return Inertia::render('admin/content-studio/create', [
            'modeOptions' => ContentProjectMode::toSelectOptions(),
            'educationLevels' => EducationLevel::query()
                ->orderBy('sort_order')
                ->get(['id', 'name', 'display_name']),
            'curriculumSubjects' => CurriculumSubject::query()
                ->orderBy('name')
                ->get(['id', 'name', 'slug']),
            'disciplines' => Discipline::query()
                ->orderBy('name')
                ->get(['id', 'name', 'slug']),
        ]);
    }

    public function store(StoreContentProjectRequest $request): RedirectResponse
    {
        Gate::authorize('create', ContentProject::class);

        $data = $request->validated();
        $data['created_by'] = $request->user()->id;

        ContentProject::query()->create($data);

        return to_route('admin.content-studio.index')
            ->with('success', 'Content project created successfully.');
    }

    public function show(ContentProject $contentProject): Response
    {
        Gate::authorize('view', $contentProject);

        $contentProject->load(['educationLevel', 'curriculumSubject', 'discipline', 'createdBy']);

        $data = $contentProject->toArray();
        unset($data['education_level'], $data['curriculum_subject'], $data['discipline'], $data['created_by'], $data['ai_context']);

        return Inertia::render('admin/content-studio/show', [
            'project' => array_merge($data, [
                'created_by' => $contentProject->getAttributeValue('created_by'),
                'mode_label' => $contentProject->mode->label(),
                'status_label' => $contentProject->status->label(),
                'education_level_name' => $contentProject->educationLevel?->display_name ?? $contentProject->educationLevel?->name,
                'curriculum_subject_name' => $contentProject->curriculumSubject?->name,
                'discipline_name' => $contentProject->discipline?->name,
                'created_by_name' => $contentProject->createdBy?->name,
            ]),
        ]);
    }
}
