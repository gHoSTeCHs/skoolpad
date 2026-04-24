<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\Paginates;
use App\Enums\ContentProjectMode;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ApproveBlockStructureRequest;
use App\Http\Requests\Admin\ApproveResearchRequest;
use App\Http\Requests\Admin\ApproveSchemeRequest;
use App\Http\Requests\Admin\GenerateBlockContentRequest;
use App\Http\Requests\Admin\GenerateTopicContentRequest;
use App\Http\Requests\Admin\ResetTopicContentRequest;
use App\Http\Requests\Admin\RunBlockStructureRequest;
use App\Http\Requests\Admin\RunCurriculumResearchRequest;
use App\Http\Requests\Admin\RunSchemeGenerationRequest;
use App\Http\Requests\Admin\SaveBlockContentRequest;
use App\Http\Requests\Admin\StoreContentProjectRequest;
use App\Http\Requests\Admin\UpdateBlockGuidanceRequest;
use App\Http\Requests\Admin\UpdateContentProjectModelsRequest;
use App\Jobs\RunBlockContentGeneration;
use App\Jobs\RunContentGeneration;
use App\Jobs\RunTopicContentGeneration;
use App\Models\AIModel;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\ContentProject;
use App\Models\CurriculumSubject;
use App\Models\Discipline;
use App\Models\EducationLevel;
use App\Models\PlatformSetting;
use App\Services\ContentBlockGenerationService;
use App\Services\ContentGenerationService;
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
        private readonly ContentGenerationService $generationService,
        private readonly ContentBlockGenerationService $blockGenerationService,
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

        $platformDefaultValue = PlatformSetting::query()
            ->where('key', 'content_studio.default_model_id')
            ->value('value');
        $platformDefaultModelId = is_array($platformDefaultValue)
            ? ($platformDefaultValue['model_id'] ?? null)
            : null;

        $resolvedModels = $aiModels->isNotEmpty()
            ? collect(['research', 'scheme', 'blocks'])->mapWithKeys(function (string $stage) use ($contentProject) {
                $model = $this->generationService->resolveModel(null, $stage, $contentProject);
                $source = $this->describeResolutionSource($contentProject, $stage);

                return [$stage => [
                    'id' => $model->id,
                    'name' => $model->name,
                    'model_id' => $model->model_id,
                    'source' => $source,
                ]];
            })->all()
            : [];

        return Inertia::render('admin/content-studio/show', [
            'project' => $contentProject->toShowArray(),
            'generationLogs' => $generationLogs,
            'aiModels' => $aiModels,
            'platformDefaultModelId' => $platformDefaultModelId,
            'resolvedModels' => $resolvedModels,
        ]);
    }

    public function updateModels(UpdateContentProjectModelsRequest $request, ContentProject $contentProject): JsonResponse
    {
        Gate::authorize('update', $contentProject);

        $contentProject->update($request->validated());

        return response()->json([
            'project' => $contentProject->refresh()->toShowArray(),
            'message' => 'Project model preferences updated.',
        ]);
    }

    private function describeResolutionSource(ContentProject $project, string $stage): string
    {
        $stageColumn = match ($stage) {
            'research' => 'research_model_id',
            'scheme' => 'scheme_model_id',
            'blocks' => 'blocks_model_id',
            default => null,
        };

        if ($stageColumn && $this->activeModelExists($project->{$stageColumn})) {
            return 'stage_override';
        }

        if ($this->activeModelExists($project->default_ai_model_id)) {
            return 'project_default';
        }

        $platformValue = PlatformSetting::query()
            ->where('key', 'content_studio.default_model_id')
            ->value('value');

        $platformModelId = is_array($platformValue) ? ($platformValue['model_id'] ?? null) : null;

        if ($this->activeModelExists($platformModelId)) {
            return 'platform_default';
        }

        return 'fallback';
    }

    private function activeModelExists(?string $modelId): bool
    {
        if (! $modelId) {
            return false;
        }

        return AIModel::query()->active()->whereKey($modelId)->exists();
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

    public function runTopicContent(
        GenerateTopicContentRequest $request,
        ContentProject $contentProject,
        CanonicalTopic $canonicalTopic,
    ): JsonResponse {
        Gate::authorize('update', $contentProject);

        if (\App\ContentStudio\Support\TopicGenerationLock::isHeld($canonicalTopic->id)) {
            return response()->json(['message' => 'Content generation already in progress for this topic.'], 409);
        }

        $jobId = Str::uuid()->toString();
        RunTopicContentGeneration::dispatch(
            $contentProject,
            $canonicalTopic,
            $jobId,
            $request->validated()['model_id'] ?? null,
            (bool) ($request->validated()['only_unstarted'] ?? true),
        );

        return response()->json(['job_id' => $jobId], 202);
    }

    public function runBlockContent(
        GenerateBlockContentRequest $request,
        ContentProject $contentProject,
        ContentBlock $contentBlock,
    ): JsonResponse {
        Gate::authorize('update', $contentProject);

        if (\App\ContentStudio\Support\TopicGenerationLock::isHeld($contentBlock->canonical_topic_id)) {
            return response()->json(['message' => 'A topic-wide generation is currently running.'], 409);
        }

        $jobId = Str::uuid()->toString();
        RunBlockContentGeneration::dispatch(
            $contentProject,
            $contentBlock,
            $jobId,
            $request->validated()['model_id'] ?? null,
        );

        return response()->json(['job_id' => $jobId], 202);
    }

    public function regenerateBlockContent(
        GenerateBlockContentRequest $request,
        ContentProject $contentProject,
        ContentBlock $contentBlock,
    ): JsonResponse {
        return $this->runBlockContent($request, $contentProject, $contentBlock);
    }

    public function saveBlockContent(
        SaveBlockContentRequest $request,
        ContentProject $contentProject,
        ContentBlock $contentBlock,
    ): JsonResponse {
        Gate::authorize('update', $contentProject);

        try {
            $this->blockGenerationService->saveBlockContent($contentBlock, $request->validated());
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'project' => $contentProject->refresh()->toShowArray(),
            'message' => 'Block content saved.',
        ]);
    }

    public function approveBlockContent(
        ContentProject $contentProject,
        ContentBlock $contentBlock,
    ): JsonResponse {
        Gate::authorize('update', $contentProject);

        try {
            $this->blockGenerationService->approveBlockContent($contentBlock);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'project' => $contentProject->refresh()->toShowArray(),
            'message' => 'Block approved.',
        ]);
    }

    public function dismissBlockAdvisory(
        ContentProject $contentProject,
        ContentBlock $contentBlock,
    ): JsonResponse {
        Gate::authorize('update', $contentProject);

        $this->blockGenerationService->dismissBlockAdvisory($contentBlock);

        return response()->json([
            'project' => $contentProject->refresh()->toShowArray(),
            'message' => 'Advisory dismissed.',
        ]);
    }

    public function updateBlockGuidance(
        UpdateBlockGuidanceRequest $request,
        ContentProject $contentProject,
        ContentBlock $contentBlock,
    ): JsonResponse {
        Gate::authorize('update', $contentProject);

        try {
            $this->blockGenerationService->updateBlockGuidance($contentBlock, $request->validated()['content_guidance']);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'project' => $contentProject->refresh()->toShowArray(),
            'message' => 'Guidance updated.',
        ]);
    }

    public function markTopicComplete(
        ContentProject $contentProject,
        CanonicalTopic $canonicalTopic,
    ): JsonResponse {
        Gate::authorize('update', $contentProject);

        try {
            $this->projectService->markTopicComplete($contentProject, $canonicalTopic);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'project' => $contentProject->refresh()->toShowArray(),
            'message' => 'Topic marked complete and published.',
        ]);
    }

    public function resetTopicContent(
        ResetTopicContentRequest $request,
        ContentProject $contentProject,
        CanonicalTopic $canonicalTopic,
    ): JsonResponse {
        Gate::authorize('update', $contentProject);

        try {
            $this->projectService->resetTopicContent($contentProject, $canonicalTopic);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'project' => $contentProject->refresh()->toShowArray(),
            'message' => 'Topic content reset.',
        ]);
    }
}
