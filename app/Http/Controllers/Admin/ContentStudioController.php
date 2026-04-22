<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\Paginates;
use App\Enums\ContentProjectMode;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ApproveBlockStructureRequest;
use App\Http\Requests\Admin\ApproveResearchRequest;
use App\Http\Requests\Admin\ApproveSchemeRequest;
use App\Http\Requests\Admin\RunBlockStructureRequest;
use App\Http\Requests\Admin\RunCurriculumResearchRequest;
use App\Http\Requests\Admin\RunSchemeGenerationRequest;
use App\Http\Requests\Admin\StoreContentProjectRequest;
use App\Jobs\RunContentGeneration;
use App\Models\AIModel;
use App\Models\ContentProject;
use App\Models\CurriculumSubject;
use App\Models\Discipline;
use App\Models\EducationLevel;
use App\Services\ContentProjectService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ContentStudioController extends Controller
{
    use Paginates;

    public function __construct(
        private readonly ContentProjectService $projectService,
    ) {}

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

        $generationLogs = $contentProject->aiGenerationLogs()
            ->select(['id', 'prompt_type', 'model_used', 'is_valid', 'tokens_used', 'estimated_cost_cents', 'created_at'])
            ->latest()
            ->limit(20)
            ->get();

        $aiModels = AIModel::query()
            ->active()
            ->orderBy('sort_order')
            ->get(['id', 'name', 'model_id']);

        return Inertia::render('admin/content-studio/show', [
            'project' => $contentProject->toShowArray(),
            'generationLogs' => $generationLogs,
            'aiModels' => $aiModels,
        ]);
    }

    public function runResearch(RunCurriculumResearchRequest $request, ContentProject $contentProject): JsonResponse
    {
        Gate::authorize('update', $contentProject);

        $jobId = Str::uuid()->toString();

        RunContentGeneration::dispatch(
            $contentProject,
            'research',
            ['document_text' => $request->validated('document_text')],
            $jobId,
            $request->validated('model_id'),
        );

        return response()->json(['job_id' => $jobId], 202);
    }

    public function approveResearch(ApproveResearchRequest $request, ContentProject $contentProject): JsonResponse
    {
        Gate::authorize('update', $contentProject);

        try {
            $this->projectService->approveResearch($contentProject, $request->validated('topics'));
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'project' => $contentProject->refresh()->toShowArray(),
            'message' => 'Research approved.',
        ]);
    }

    public function runScheme(RunSchemeGenerationRequest $request, ContentProject $contentProject): JsonResponse
    {
        Gate::authorize('update', $contentProject);

        $jobId = Str::uuid()->toString();
        $context = collect($request->validated())->except('model_id')->all();

        RunContentGeneration::dispatch(
            $contentProject,
            'scheme',
            $context,
            $jobId,
            $request->validated('model_id'),
        );

        return response()->json(['job_id' => $jobId], 202);
    }

    public function approveScheme(ApproveSchemeRequest $request, ContentProject $contentProject): JsonResponse
    {
        Gate::authorize('update', $contentProject);

        try {
            $this->projectService->approveScheme($contentProject, $request->validated('terms'));
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'project' => $contentProject->refresh()->toShowArray(),
            'message' => 'Scheme of work approved. You can now generate block structures.',
        ]);
    }

    public function runBlocks(RunBlockStructureRequest $request, ContentProject $contentProject): JsonResponse
    {
        Gate::authorize('update', $contentProject);

        $jobId = Str::uuid()->toString();

        RunContentGeneration::dispatch(
            $contentProject,
            'blocks',
            ['topic_key' => $request->validated('topic_key')],
            $jobId,
            $request->validated('model_id'),
        );

        return response()->json(['job_id' => $jobId], 202);
    }

    public function approveBlocks(ApproveBlockStructureRequest $request, ContentProject $contentProject): JsonResponse
    {
        Gate::authorize('update', $contentProject);

        try {
            $this->projectService->approveBlockStructure(
                $contentProject,
                $request->validated('topic_key'),
                $request->validated(),
            );
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'project' => $contentProject->refresh()->toShowArray(),
            'message' => 'Block structure approved. Topic and blocks created.',
        ]);
    }

    public function skipScheme(ContentProject $contentProject): JsonResponse
    {
        Gate::authorize('update', $contentProject);

        try {
            $this->projectService->skipScheme($contentProject);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'project' => $contentProject->refresh()->toShowArray(),
            'message' => 'Scheme of work skipped.',
        ]);
    }
}
