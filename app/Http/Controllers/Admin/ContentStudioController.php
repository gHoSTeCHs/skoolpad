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

        return Inertia::render('admin/content-studio/show', $this->buildShowProps($contentProject));
    }

    public function preview(ContentProject $contentProject): Response
    {
        Gate::authorize('view', $contentProject);

        return Inertia::render('admin/content-studio/show-preview', $this->buildShowProps($contentProject));
    }

    /**
     * @return array<string, mixed>
     */
    private function buildShowProps(ContentProject $contentProject): array
    {
        $generationLogs = $contentProject->aiGenerationLogs()
            ->select([
                'id',
                'content_block_id',
                'canonical_topic_id',
                'prompt_type',
                'model_used',
                'is_valid',
                'tokens_used',
                'estimated_cost_cents',
                'created_at',
            ])
            ->latest()
            ->limit(100)
            ->get();

        $activeModels = AIModel::query()
            ->active()
            ->with('provider:id,name,slug,supports_thinking')
            ->orderByRaw('(SELECT sort_order FROM ai_providers WHERE ai_providers.id = ai_models.provider_id)')
            ->orderBy('sort_order')
            ->get();

        $aiModels = $activeModels->map(fn (AIModel $m) => [
            'id' => $m->id,
            'name' => $m->name,
            'model_id' => $m->model_id,
            'thinking_mode' => $m->thinking_mode->value,
            'provider_name' => $m->provider->name,
            'provider_slug' => $m->provider->slug,
        ]);

        $platformDefaultValue = \Illuminate\Support\Facades\Cache::remember(
            'platform_setting.content_studio_default_model', 60,
            fn () => PlatformSetting::query()->where('key', 'content_studio.default_model_id')->value('value')
        );
        $platformDefaultModelId = is_array($platformDefaultValue)
            ? ($platformDefaultValue['model_id'] ?? null)
            : null;

        $taskRouting = \Illuminate\Support\Facades\Cache::remember(
            'platform_setting.ai_task_routing', 60,
            fn () => PlatformSetting::query()->where('key', 'ai_task_routing')->value('value') ?? []
        );

        $activeModelIds = $activeModels->pluck('id')->flip();

        $resolvedModels = $activeModels->isNotEmpty()
            ? collect(['research', 'scheme', 'blocks', 'content'])->mapWithKeys(function (string $stage) use ($contentProject, $platformDefaultModelId, $taskRouting, $activeModelIds, $activeModels) {
                $source = $this->describeResolutionSource($contentProject, $stage, $platformDefaultModelId, $activeModelIds);
                $modelId = $this->resolveModelIdInMemory($contentProject, $stage, $platformDefaultModelId, $taskRouting, $activeModelIds);
                $model = $modelId
                    ? $activeModels->firstWhere('id', $modelId)
                    : $activeModels->sortBy('sort_order')->first();

                return [$stage => [
                    'id' => $model?->id,
                    'name' => $model?->name,
                    'model_id' => $model?->model_id,
                    'source' => $source,
                ]];
            })->all()
            : [];

        $approvedTopicIds = collect($contentProject->progress_data['blocks_approved'] ?? [])
            ->pluck('topic_id')->filter()->values()->all();

        $topicsWithBlocks = \App\Models\CanonicalTopic::query()
            ->whereIn('id', $approvedTopicIds)
            ->with('contentBlocks')
            ->get()
            ->map(fn (\App\Models\CanonicalTopic $topic) => [
                'id' => $topic->id,
                'title' => $topic->title,
                'slug' => $topic->slug,
                'summary' => $topic->summary,
                'estimated_read_minutes' => $topic->estimated_read_minutes,
                'education_level' => $topic->education_level,
                'is_published' => $topic->is_published,
                'published_at' => $topic->published_at?->toIso8601String(),
                'glossary' => $topic->glossary,
                'blocks' => $topic->contentBlocks
                    ->sortBy(fn (\App\Models\ContentBlock $b) => \App\Services\ContentBlockGenerationService::pathKey($b->path))
                    ->map(fn (\App\Models\ContentBlock $b) => [
                        'id' => $b->id,
                        'canonical_topic_id' => $b->canonical_topic_id,
                        'parent_block_id' => $b->parent_block_id,
                        'title' => $b->title,
                        'slug' => $b->slug,
                        'block_type' => $b->block_type->value,
                        'path' => $b->path,
                        'depth_level' => $b->depth_level,
                        'sort_order' => $b->sort_order,
                        'is_container' => $b->is_container,
                        'content' => $b->content,
                        'simplified_content' => $b->simplified_content,
                        'estimated_read_time' => $b->estimated_read_time,
                        'difficulty_level' => $b->difficulty_level?->value,
                        'bloom_level' => $b->bloom_level?->value,
                        'visualization_config' => $b->visualization_config,
                        'is_published' => $b->is_published,
                        'content_guidance' => $b->content_guidance,
                        'generation_status' => $b->generation_status->value,
                        'summary_sentence' => $b->summary_sentence,
                        'key_terms_introduced' => $b->key_terms_introduced,
                        'symbols_used' => $b->symbols_used,
                        'formulas_used' => $b->formulas_used,
                        'word_count' => $b->word_count,
                        'nigerian_context_used' => $b->nigerian_context_used,
                        'last_generated_at' => $b->last_generated_at?->toIso8601String(),
                        'last_generation_log_id' => $b->last_generation_log_id,
                        'drift_advisory' => $b->drift_advisory
                            ? array_diff_key($b->drift_advisory, ['source_block_id' => null])
                            : null,
                    ])->values()->all(),
            ])->values()->all();

        return [
            'project' => $contentProject->toShowArray(),
            'generationLogs' => $generationLogs,
            'aiModels' => $aiModels,
            'platformDefaultModelId' => $platformDefaultModelId,
            'resolvedModels' => $resolvedModels,
            'topicsWithBlocks' => $topicsWithBlocks,
        ];
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

    private function resolveModelIdInMemory(
        ContentProject $project,
        string $stage,
        ?string $platformDefaultModelId,
        mixed $taskRouting,
        \Illuminate\Support\Collection $activeModelIds
    ): ?string {
        $stageColumn = match ($stage) {
            'research' => 'research_model_id',
            'scheme' => 'scheme_model_id',
            'blocks' => 'blocks_model_id',
            'content' => 'content_model_id',
            default => null,
        };

        if ($stageColumn && $project->{$stageColumn} && $activeModelIds->has($project->{$stageColumn})) {
            return $project->{$stageColumn};
        }
        if ($project->default_ai_model_id && $activeModelIds->has($project->default_ai_model_id)) {
            return $project->default_ai_model_id;
        }
        $routedId = is_array($taskRouting) ? ($taskRouting[$stage] ?? null) : null;
        if ($routedId && $activeModelIds->has($routedId)) {
            return $routedId;
        }
        if ($platformDefaultModelId && $activeModelIds->has($platformDefaultModelId)) {
            return $platformDefaultModelId;
        }

        return null;
    }

    private function describeResolutionSource(ContentProject $project, string $stage, ?string $platformModelId = null, ?\Illuminate\Support\Collection $activeModelIds = null): string
    {
        $stageColumn = match ($stage) {
            'research' => 'research_model_id',
            'scheme' => 'scheme_model_id',
            'blocks' => 'blocks_model_id',
            'content' => 'content_model_id',
            default => null,
        };

        if ($stageColumn && $this->activeModelExists($project->{$stageColumn}, $activeModelIds)) {
            return 'stage_override';
        }

        if ($this->activeModelExists($project->default_ai_model_id, $activeModelIds)) {
            return 'project_default';
        }

        if ($this->activeModelExists($platformModelId, $activeModelIds)) {
            return 'platform_default';
        }

        return 'fallback';
    }

    private function assertTopicBelongsToProject(ContentProject $project, CanonicalTopic $topic): void
    {
        $approvedTopicIds = collect($project->progress_data['blocks_approved'] ?? [])
            ->pluck('topic_id')
            ->filter()
            ->all();

        abort_unless(in_array($topic->id, $approvedTopicIds, true), 403, 'Topic does not belong to this project.');
    }

    private function assertBlockBelongsToProject(ContentProject $project, ContentBlock $block): void
    {
        $approvedTopicIds = collect($project->progress_data['blocks_approved'] ?? [])
            ->pluck('topic_id')
            ->filter()
            ->all();

        abort_unless(in_array($block->canonical_topic_id, $approvedTopicIds, true), 403, 'Block does not belong to this project.');
    }

    private function activeModelExists(?string $modelId, ?\Illuminate\Support\Collection $activeModelIds = null): bool
    {
        if (! $modelId) {
            return false;
        }

        if ($activeModelIds !== null) {
            return $activeModelIds->has($modelId);
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
        $this->assertTopicBelongsToProject($contentProject, $canonicalTopic);

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
        $this->assertBlockBelongsToProject($contentProject, $contentBlock);

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
        Gate::authorize('update', $contentProject);
        $this->assertBlockBelongsToProject($contentProject, $contentBlock);

        return $this->runBlockContent($request, $contentProject, $contentBlock);
    }

    public function saveBlockContent(
        SaveBlockContentRequest $request,
        ContentProject $contentProject,
        ContentBlock $contentBlock,
    ): JsonResponse {
        Gate::authorize('update', $contentProject);
        $this->assertBlockBelongsToProject($contentProject, $contentBlock);

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
        $this->assertBlockBelongsToProject($contentProject, $contentBlock);

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
        $this->assertBlockBelongsToProject($contentProject, $contentBlock);

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
        $this->assertBlockBelongsToProject($contentProject, $contentBlock);

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
        $this->assertTopicBelongsToProject($contentProject, $canonicalTopic);

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
        $this->assertTopicBelongsToProject($contentProject, $canonicalTopic);

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
