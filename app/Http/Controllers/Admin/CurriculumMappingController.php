<?php

namespace App\Http\Controllers\Admin;

use App\Enums\TeachingDepth;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\LoadLevelSubjectRequest;
use App\Http\Requests\Admin\UpdateCurriculumMappingRequest;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\CourseBlockMapping;
use App\Models\EducationSystem;
use App\Models\InstitutionCourse;
use App\Services\Admin\CourseMappingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CurriculumMappingController extends Controller
{
    public function __construct(
        private readonly CourseMappingService $courseMappingService,
    ) {}

    public function index(): Response
    {
        Gate::authorize('manageMappings', InstitutionCourse::class);

        $educationSystems = EducationSystem::query()->with([
            'curriculumTiers' => fn ($q) => $q->orderBy('sort_order'),
            'curriculumTiers.educationLevels' => fn ($q) => $q->orderBy('sort_order'),
            'curriculumSubjects' => fn ($q) => $q->with('discipline:id,name')->orderBy('name'),
            'streams' => fn ($q) => $q->orderBy('name'),
        ])->orderBy('name')->get();

        return Inertia::render('admin/curriculum-mappings/index', [
            'educationSystems' => $educationSystems,
            'teachingDepths' => TeachingDepth::toSelectOptions(),
        ]);
    }

    public function load(LoadLevelSubjectRequest $request): JsonResponse
    {
        Gate::authorize('manageMappings', InstitutionCourse::class);

        $validated = $request->validated();

        $levelSubject = $this->courseMappingService->findOrCreateLevelSubject($validated);

        $mappings = CourseBlockMapping::query()->where('curriculum_subject_level_id', $levelSubject->id)
            ->with('contentBlock:id,title,path,block_type,is_container')
            ->get()
            ->map(fn (CourseBlockMapping $m) => [
                'id' => $m->id,
                'content_block_id' => $m->content_block_id,
                'block_title' => $m->contentBlock->title,
                'block_path' => $m->contentBlock->path,
                'block_type' => $m->contentBlock->block_type->value,
                'is_container' => $m->contentBlock->is_container,
                'teaching_depth' => $m->teaching_depth->value,
                'is_core_block' => $m->is_core_block,
            ])
            ->values()
            ->all();

        $discipline = $levelSubject->curriculumSubject->discipline;
        $topics = $discipline
            ? CanonicalTopic::forDiscipline($discipline->id)
                ->where('is_published', true)
                ->whereHas('contentBlocks')
                ->with(['contentBlocks' => fn ($q) => $q->where('is_published', true)->orderBy('path')])
                ->orderBy('title')
                ->get(['id', 'title'])
                ->map(fn (CanonicalTopic $t) => [
                    'id' => $t->id,
                    'title' => $t->title,
                    'blocks' => $t->contentBlocks->map(fn (ContentBlock $b) => [
                        'id' => $b->id,
                        'title' => $b->title,
                        'path' => $b->path,
                        'block_type' => $b->block_type->value,
                        'is_container' => $b->is_container,
                    ])->values()->all(),
                ])
                ->values()
                ->all()
            : [];

        return response()->json([
            'level_subject_id' => $levelSubject->id,
            'mappings' => $mappings,
            'topics' => $topics,
        ]);
    }

    public function update(UpdateCurriculumMappingRequest $request): RedirectResponse
    {
        Gate::authorize('manageMappings', InstitutionCourse::class);

        $validated = $request->validated();

        $this->courseMappingService->saveCurriculumBlockMappings(
            $validated['curriculum_subject_level_id'],
            $validated['mappings']
        );

        return back()->with('success', 'Curriculum block mappings updated.');
    }
}
