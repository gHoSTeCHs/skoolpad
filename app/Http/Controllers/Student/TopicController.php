<?php

namespace App\Http\Controllers\Student;

use App\Concerns\Paginates;
use App\Enums\TopicDifficulty;
use App\Http\Controllers\Controller;
use App\Http\Requests\Student\ToggleBlockCompleteRequest;
use App\Models\BlockCompletion;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\Discipline;
use App\Models\InstitutionCourse;
use App\Models\StudentNote;
use App\Models\TopicCompletion;
use App\Services\Student\PrerequisiteGapService;
use App\Services\Student\TopicBrowseService;
use App\Services\Student\TopicContentService;
use App\Services\Student\TopicProgressService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TopicController extends Controller
{
    use Paginates;

    public function __construct(
        private readonly PrerequisiteGapService $prerequisiteService,
        private readonly TopicBrowseService $topicBrowseService,
        private readonly TopicContentService $topicContentService,
        private readonly TopicProgressService $topicProgressService,
    ) {}

    public function browse(Request $request): Response
    {
        $user = $request->user();
        $profile = $user->studentProfile;
        $browseAll = $request->boolean('browse_all');

        $scope = $this->topicBrowseService->resolveTopicScope($profile, $browseAll);

        $completedTopicIds = $this->topicBrowseService->getCompletedTopicIds($user, $scope['topic_ids']);

        $filters = [
            'search' => $request->string('search')->value() ?: null,
            'difficulty' => $request->string('difficulty')->value() ?: null,
            'course_id' => $request->string('course_id')->value() ?: null,
            'discipline_id' => $request->string('discipline_id')->value() ?: null,
            'completion' => $request->string('completion')->value() ?: null,
        ];

        $query = $this->topicBrowseService->buildFilteredQuery(
            $scope['topic_ids'],
            $completedTopicIds,
            $filters,
            $browseAll,
        );

        $totalCount = (clone $query)->count();
        $paginator = $query->paginate(self::DEFAULT_PER_PAGE);

        $paginatedTopicIds = collect($paginator->items())->pluck('id');
        $aggregates = $this->topicBrowseService->getTopicAggregates($user, $paginatedTopicIds, $scope['course_ids']);
        $this->topicBrowseService->transformPaginatedTopics($paginator, $aggregates, $completedTopicIds);

        $enrolledCourses = InstitutionCourse::query()->whereIn('id', $scope['enrolled_course_ids'])
            ->select('id', 'course_code', 'course_title')
            ->orderBy('course_code')
            ->get();

        $disciplines = Discipline::query()
            ->whereHas('canonicalTopics', fn ($q) => $q->published()
                ->whereIn('id', $scope['topic_ids']))
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('topics/browse', [
            'topics' => $this->paginated($paginator),
            'filterOptions' => [
                'courses' => $enrolledCourses,
                'disciplines' => $disciplines,
                'difficulties' => TopicDifficulty::values(),
            ],
            'appliedFilters' => array_merge($filters, [
                'browse_all' => $browseAll ? 'true' : null,
            ]),
            'totalCount' => $totalCount,
            'completedCount' => $completedTopicIds->count(),
        ]);
    }

    public function show(CanonicalTopic $topic, Request $request): Response
    {
        abort_unless($topic->is_published, 404);

        $user = $request->user();
        $courseId = $request->string('course')->value() ?: null;

        $topic->load('discipline:id,name');

        $courseContext = null;
        $prevTopic = null;
        $nextTopic = null;

        if ($courseId) {
            $profile = $user->studentProfile;
            $nav = $profile
                ? $this->topicContentService->getCourseContext($topic, $courseId, $profile)
                : ['course' => null, 'prev_topic' => null, 'next_topic' => null];

            $courseContext = $nav['course'];
            $prevTopic = $nav['prev_topic'];
            $nextTopic = $nav['next_topic'];
        }

        $hasBlocks = $topic->contentBlocks()->exists();
        $blockTree = null;
        $completedBlockIds = [];
        $lockedBlockIds = [];

        if ($hasBlocks) {
            $blockTree = $this->buildBlockTree($topic);
            $blockIds = $topic->contentBlocks()->pluck('id');
            $completedBlockIds = BlockCompletion::query()->where('user_id', $user->id)
                ->whereIn('content_block_id', $blockIds)
                ->pluck('content_block_id')
                ->toArray();
            $lockedBlockIds = $this->prerequisiteService->getLockedBlockIds($user, $topic);
        }

        $prerequisiteStatus = $this->prerequisiteService->getPrerequisiteStatus($user, $topic);

        $relatedQuestions = $this->topicContentService->getRelatedQuestions($topic, $courseId);
        $crossInstitutionCount = $this->topicContentService->countCrossInstitutionQuestions($topic);

        $isTopicCompleted = TopicCompletion::query()->where('user_id', $user->id)
            ->where('canonical_topic_id', $topic->id)
            ->exists();

        $profile = $user->studentProfile;
        $isSecondary = $profile?->isSecondary() ?? false;

        $topicNotes = [];
        if (! $isSecondary) {
            $topicNotes = StudentNote::query()
                ->where('user_id', $user->id)
                ->where('canonical_topic_id', $topic->id)
                ->orderByDesc('is_pinned')
                ->orderByDesc('updated_at')
                ->get(['id', 'title', 'is_pinned', 'updated_at'])
                ->map(fn ($n) => [
                    'id' => $n->id,
                    'title' => $n->title,
                    'is_pinned' => $n->is_pinned,
                    'updated_at' => $n->updated_at->toISOString(),
                ])
                ->all();
        }

        return Inertia::render('topics/show', [
            'topic' => [
                'id' => $topic->id,
                'title' => $topic->title,
                'slug' => $topic->slug,
                'content' => $topic->content,
                'simplified_content' => $topic->simplified_content,
                'summary' => $topic->summary,
                'difficulty_level' => $topic->difficulty_level?->value,
                'estimated_read_minutes' => $topic->estimated_read_minutes,
                'discipline' => $topic->discipline ? [
                    'id' => $topic->discipline->id,
                    'name' => $topic->discipline->name,
                ] : null,
            ],
            'hasBlocks' => $hasBlocks,
            'blockTree' => $blockTree,
            'completedBlockIds' => $completedBlockIds,
            'lockedBlockIds' => $lockedBlockIds,
            'isTopicCompleted' => $isTopicCompleted,
            'prerequisiteStatus' => $prerequisiteStatus,
            'courseContext' => $courseContext,
            'prevTopic' => $prevTopic,
            'nextTopic' => $nextTopic,
            'relatedQuestions' => $relatedQuestions,
            'crossInstitutionCount' => $crossInstitutionCount,
            'topicNotes' => $topicNotes,
            'isSecondary' => $isSecondary,
        ]);
    }

    public function read(CanonicalTopic $topic, Request $request): Response
    {
        abort_unless($topic->is_published, 404);

        $user = $request->user();
        $courseId = $request->string('course')->value() ?: null;

        $topic->load('discipline:id,name');

        $courseContext = null;

        if ($courseId) {
            $profile = $user->studentProfile;
            $isEnrolled = $profile?->studentCourses()->where('institution_course_id', $courseId)->exists();
            $course = $isEnrolled ? InstitutionCourse::query()->find($courseId) : null;
            if ($course) {
                $courseContext = [
                    'id' => $course->id,
                    'course_code' => $course->course_code,
                    'course_title' => $course->course_title,
                ];
            }
        }

        $blockTree = null;
        $completedBlockIds = [];
        $totalReadTime = 0;

        if ($topic->contentBlocks()->exists()) {
            $blockTree = $this->buildBlockTree($topic);
            $blockIds = $topic->contentBlocks()->pluck('id');
            $completedBlockIds = BlockCompletion::query()->where('user_id', $user->id)
                ->whereIn('content_block_id', $blockIds)
                ->pluck('content_block_id')
                ->toArray();

            $totalReadTime = $topic->contentBlocks()
                ->where('is_published', true)
                ->sum('estimated_read_time');
        }

        return Inertia::render('topics/read', [
            'topic' => [
                'id' => $topic->id,
                'title' => $topic->title,
                'slug' => $topic->slug,
                'content' => $topic->content,
                'simplified_content' => $topic->simplified_content,
                'summary' => $topic->summary,
                'difficulty_level' => $topic->difficulty_level?->value,
                'estimated_read_minutes' => $topic->estimated_read_minutes,
                'discipline' => $topic->discipline ? [
                    'id' => $topic->discipline->id,
                    'name' => $topic->discipline->name,
                ] : null,
            ],
            'blockTree' => $blockTree,
            'completedBlockIds' => $completedBlockIds,
            'courseContext' => $courseContext,
            'totalReadTime' => $totalReadTime,
        ]);
    }

    public function toggleComplete(CanonicalTopic $topic, Request $request): RedirectResponse
    {
        abort_unless($topic->is_published, 404);

        $this->topicProgressService->toggleTopicCompletion($request->user(), $topic);

        return back();
    }

    public function toggleBlockComplete(ContentBlock $block, ToggleBlockCompleteRequest $request): RedirectResponse
    {
        abort_unless($block->is_published, 404);
        $block->loadMissing('canonicalTopic');
        abort_unless($block->canonicalTopic?->is_published, 404);

        $this->topicProgressService->toggleBlockCompletion(
            $request->user(),
            $block,
            $request->validated('reading_time_seconds'),
        );

        return back();
    }

    /** @return array<int, array<string, mixed>> */
    private function buildBlockTree(CanonicalTopic $topic): array
    {
        $blocks = $topic->contentBlocks()
            ->where('is_published', true)
            ->with('prerequisites:content_blocks.id,content_blocks.title')
            ->orderBy('sort_order')
            ->get();

        $blocksByParent = $blocks->groupBy(fn ($b) => $b->parent_block_id ?? 'root');

        return $this->nestBlocks($blocksByParent, 'root');
    }

    /**
     * @param  \Illuminate\Support\Collection<string, \Illuminate\Support\Collection<int, ContentBlock>>  $blocksByParent
     * @return array<int, array<string, mixed>>
     */
    private function nestBlocks($blocksByParent, string $parentId): array
    {
        $children = $blocksByParent->get($parentId, collect());

        return $children->map(fn (ContentBlock $block) => [
            'id' => $block->id,
            'title' => $block->title,
            'path' => $block->path,
            'blockType' => $block->block_type->value,
            'depthLevel' => $block->depth_level,
            'estimatedReadTime' => $block->estimated_read_time,
            'difficultyLevel' => $block->difficulty_level?->value,
            'content' => $block->content,
            'simplifiedContent' => $block->simplified_content,
            'isContainer' => $block->is_container,
            'prerequisites' => $block->prerequisites->map(fn ($prereq) => [
                'id' => $prereq->id,
                'title' => $prereq->title,
                'isHard' => (bool) $prereq->pivot->is_hard_prerequisite,
            ])->values()->all(),
            'children' => $this->nestBlocks($blocksByParent, $block->id),
        ])->values()->all();
    }
}
