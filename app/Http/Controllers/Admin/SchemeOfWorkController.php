<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\LoadSchemeOfWorkRequest;
use App\Http\Requests\Admin\UpdateSchemeOfWorkRequest;
use App\Models\CanonicalTopic;
use App\Models\EducationSystem;
use App\Models\InstitutionCourse;
use App\Models\SchemeOfWorkItem;
use App\Services\Admin\CourseMappingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SchemeOfWorkController extends Controller
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
            'curriculumSubjects' => fn ($q) => $q->orderBy('name'),
            'streams' => fn ($q) => $q->orderBy('name'),
        ])->orderBy('name')->get();

        return Inertia::render('admin/scheme-of-work/index', [
            'educationSystems' => $educationSystems,
            'topics' => CanonicalTopic::query()->where('is_published', true)
                ->orderBy('title')
                ->get(['id', 'title']),
        ]);
    }

    public function load(LoadSchemeOfWorkRequest $request): JsonResponse
    {
        Gate::authorize('manageMappings', InstitutionCourse::class);

        $validated = $request->validated();

        $levelSubject = $this->courseMappingService->findOrCreateLevelSubject($validated);

        $items = SchemeOfWorkItem::query()->where('curriculum_subject_level_id', $levelSubject->id)
            ->where('term', $validated['term'])
            ->with(['canonicalTopic:id,title', 'contentBlock:id,title,path'])
            ->orderBy('week_number')
            ->get()
            ->map(fn (SchemeOfWorkItem $item) => [
                'id' => $item->id,
                'week_number' => $item->week_number,
                'topic_label' => $item->topic_label,
                'canonical_topic_id' => $item->canonical_topic_id,
                'content_block_id' => $item->content_block_id,
                'canonical_topic' => $item->canonicalTopic ? [
                    'id' => $item->canonicalTopic->id,
                    'title' => $item->canonicalTopic->title,
                ] : null,
                'content_block' => $item->contentBlock ? [
                    'id' => $item->contentBlock->id,
                    'title' => $item->contentBlock->title,
                    'path' => $item->contentBlock->path,
                ] : null,
            ])
            ->values()
            ->all();

        return response()->json([
            'level_subject_id' => $levelSubject->id,
            'items' => $items,
        ]);
    }

    public function update(UpdateSchemeOfWorkRequest $request): RedirectResponse
    {
        Gate::authorize('manageMappings', InstitutionCourse::class);

        $validated = $request->validated();

        $this->courseMappingService->saveSchemeOfWork(
            $validated['curriculum_subject_level_id'],
            $validated['term'],
            $validated['items']
        );

        return back()->with('success', 'Scheme of work updated.');
    }
}
