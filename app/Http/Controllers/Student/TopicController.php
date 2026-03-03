<?php

namespace App\Http\Controllers\Student;

use App\Concerns\Paginates;
use App\Enums\TopicDifficulty;
use App\Http\Controllers\Controller;
use App\Models\BlockCompletion;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\CourseTopicMapping;
use App\Models\Discipline;
use App\Models\InstitutionCourse;
use App\Models\QuestionTopicLink;
use App\Models\TopicCompletion;
use App\Services\PrerequisiteGapService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TopicController extends Controller
{
    use Paginates;

    public function __construct(
        private PrerequisiteGapService $prerequisiteService
    ) {}

    public function browse(Request $request): Response
    {
        $user = $request->user();
        $profile = $user->studentProfile;

        $browseAll = $request->boolean('browse_all');

        $enrolledCourseIds = $profile
            ->studentCourses()
            ->where('is_archived', false)
            ->pluck('institution_course_id');

        $courseIds = $browseAll
            ? InstitutionCourse::where('institution_id', $profile->institution_id)->pluck('id')
            : $enrolledCourseIds;

        $topicIdsQuery = CourseTopicMapping::whereIn('institution_course_id', $courseIds)
            ->pluck('canonical_topic_id')
            ->unique();

        $query = CanonicalTopic::query()
            ->published()
            ->whereIn('id', $topicIdsQuery)
            ->with('discipline:id,name');

        if ($request->filled('search')) {
            $query->search($request->string('search'));
        }

        if ($request->filled('difficulty')) {
            $query->where('difficulty_level', $request->string('difficulty')->value());
        }

        if (! $browseAll && $request->filled('course_id')) {
            $courseTopicIds = CourseTopicMapping::where('institution_course_id', $request->string('course_id')->value())
                ->pluck('canonical_topic_id');
            $query->whereIn('id', $courseTopicIds);
        }

        if ($browseAll && $request->filled('discipline_id')) {
            $query->where('discipline_id', $request->string('discipline_id')->value());
        }

        $allTopicIds = (clone $query)->pluck('id');

        $completedTopicIds = TopicCompletion::where('user_id', $user->id)
            ->whereIn('canonical_topic_id', $allTopicIds)
            ->pluck('canonical_topic_id');

        if ($request->filled('completion')) {
            $completion = $request->string('completion')->value();
            if ($completion === 'completed') {
                $query->whereIn('id', $completedTopicIds);
            } elseif ($completion === 'not_started') {
                $query->whereNotIn('id', $completedTopicIds);
            }
        }

        $query->orderBy('title');
        $paginator = $query->paginate(self::DEFAULT_PER_PAGE);

        $paginatedTopicIds = collect($paginator->items())->pluck('id');

        $blockCounts = ContentBlock::query()
            ->whereIn('canonical_topic_id', $paginatedTopicIds)
            ->where('is_published', true)
            ->where('is_container', false)
            ->selectRaw('canonical_topic_id, count(*) as total')
            ->groupBy('canonical_topic_id')
            ->pluck('total', 'canonical_topic_id');

        $completedBlockCounts = BlockCompletion::query()
            ->where('user_id', $user->id)
            ->join('content_blocks', 'block_completions.content_block_id', '=', 'content_blocks.id')
            ->whereIn('content_blocks.canonical_topic_id', $paginatedTopicIds)
            ->where('content_blocks.is_published', true)
            ->where('content_blocks.is_container', false)
            ->selectRaw('content_blocks.canonical_topic_id, count(*) as completed')
            ->groupBy('content_blocks.canonical_topic_id')
            ->pluck('completed', 'content_blocks.canonical_topic_id');

        $questionCounts = QuestionTopicLink::query()
            ->whereIn('canonical_topic_id', $paginatedTopicIds)
            ->whereHas('question', fn ($q) => $q->published())
            ->selectRaw('canonical_topic_id, count(*) as count')
            ->groupBy('canonical_topic_id')
            ->pluck('count', 'canonical_topic_id');

        $coursesByTopic = CourseTopicMapping::query()
            ->whereIn('canonical_topic_id', $paginatedTopicIds)
            ->whereIn('institution_course_id', $courseIds)
            ->with('course:id,course_code,course_title')
            ->get()
            ->groupBy('canonical_topic_id')
            ->map(fn ($mappings) => $mappings->map(fn ($m) => [
                'id' => $m->course->id,
                'course_code' => $m->course->course_code,
                'course_title' => $m->course->course_title,
            ])->unique('id')->values());

        $completedTopicIdsArray = $completedTopicIds->toArray();

        $paginator->getCollection()->transform(fn (CanonicalTopic $topic) => [
            'id' => $topic->id,
            'title' => $topic->title,
            'slug' => $topic->slug,
            'difficulty_level' => $topic->difficulty_level?->value,
            'estimated_read_minutes' => $topic->estimated_read_minutes,
            'discipline' => $topic->discipline ? [
                'id' => $topic->discipline->id,
                'name' => $topic->discipline->name,
            ] : null,
            'is_completed' => in_array($topic->id, $completedTopicIdsArray),
            'total_blocks' => $blockCounts[$topic->id] ?? 0,
            'completed_blocks' => $completedBlockCounts[$topic->id] ?? 0,
            'question_count' => $questionCounts[$topic->id] ?? 0,
            'courses' => $coursesByTopic[$topic->id] ?? [],
        ]);

        $enrolledCourses = InstitutionCourse::whereIn('id', $enrolledCourseIds)
            ->select('id', 'course_code', 'course_title')
            ->orderBy('course_code')
            ->get();

        $disciplines = Discipline::query()
            ->whereHas('canonicalTopics', fn ($q) => $q->published()
                ->whereIn('id', $topicIdsQuery))
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
            'appliedFilters' => [
                'browse_all' => $browseAll ? 'true' : null,
                'course_id' => $request->string('course_id')->value() ?: null,
                'discipline_id' => $request->string('discipline_id')->value() ?: null,
                'difficulty' => $request->string('difficulty')->value() ?: null,
                'completion' => $request->string('completion')->value() ?: null,
                'search' => $request->string('search')->value() ?: null,
            ],
            'totalCount' => $allTopicIds->count(),
            'completedCount' => $completedTopicIds->count(),
        ]);
    }

    public function show(CanonicalTopic $topic, Request $request): Response
    {
        $user = $request->user();
        $courseId = $request->string('course')->value() ?: null;

        $topic->load('discipline:id,name');

        $courseContext = null;
        $prevTopic = null;
        $nextTopic = null;

        if ($courseId) {
            $course = InstitutionCourse::find($courseId);
            if ($course) {
                $courseContext = [
                    'id' => $course->id,
                    'course_code' => $course->course_code,
                    'course_title' => $course->course_title,
                ];

                $currentMapping = CourseTopicMapping::where('institution_course_id', $courseId)
                    ->where('canonical_topic_id', $topic->id)
                    ->first();

                if ($currentMapping) {
                    $prevMapping = CourseTopicMapping::where('institution_course_id', $courseId)
                        ->where('sequence_order', '<', $currentMapping->sequence_order)
                        ->orderByDesc('sequence_order')
                        ->with('topic:id,title,slug')
                        ->first();

                    $nextMapping = CourseTopicMapping::where('institution_course_id', $courseId)
                        ->where('sequence_order', '>', $currentMapping->sequence_order)
                        ->orderBy('sequence_order')
                        ->with('topic:id,title,slug')
                        ->first();

                    $prevTopic = $prevMapping ? [
                        'id' => $prevMapping->topic->id,
                        'title' => $prevMapping->topic->title,
                    ] : null;

                    $nextTopic = $nextMapping ? [
                        'id' => $nextMapping->topic->id,
                        'title' => $nextMapping->topic->title,
                    ] : null;
                }
            }
        }

        $hasBlocks = $topic->contentBlocks()->exists();
        $blockTree = null;
        $completedBlockIds = [];
        $lockedBlockIds = [];

        if ($hasBlocks) {
            $blockTree = $this->buildBlockTree($topic);
            $blockIds = $topic->contentBlocks()->pluck('id');
            $completedBlockIds = BlockCompletion::where('user_id', $user->id)
                ->whereIn('content_block_id', $blockIds)
                ->pluck('content_block_id')
                ->toArray();
            $lockedBlockIds = $this->prerequisiteService->getLockedBlockIds($user, $topic);
        }

        $prerequisiteStatus = $this->prerequisiteService->getPrerequisiteStatus($user, $topic);

        $relatedQuestions = \App\Models\Question::query()
            ->published()
            ->whereNull('parent_question_id')
            ->whereHas('topicLinks', fn ($q) => $q->where('canonical_topic_id', $topic->id))
            ->when($courseId, fn ($q) => $q->where('institution_course_id', $courseId))
            ->with([
                'topicLinks.canonicalTopic:id,title',
                'answers' => fn ($q) => $q->where('is_published', true),
                'children' => fn ($q) => $q->published()->orderBy('sort_order'),
                'children.answers' => fn ($q) => $q->where('is_published', true),
                'children.children' => fn ($q) => $q->published()->orderBy('sort_order'),
                'children.children.answers' => fn ($q) => $q->where('is_published', true),
                'children.children.children' => fn ($q) => $q->published()->orderBy('sort_order'),
                'children.children.children.answers' => fn ($q) => $q->where('is_published', true),
            ])
            ->limit(10)
            ->get();

        $crossInstitutionCount = \App\Models\Question::query()
            ->published()
            ->whereHas('topicLinks', fn ($q) => $q->where('canonical_topic_id', $topic->id))
            ->count();

        $isTopicCompleted = TopicCompletion::where('user_id', $user->id)
            ->where('canonical_topic_id', $topic->id)
            ->exists();

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
        ]);
    }

    public function read(CanonicalTopic $topic, Request $request): Response
    {
        $user = $request->user();
        $courseId = $request->string('course')->value() ?: null;

        $topic->load('discipline:id,name');

        $courseContext = null;

        if ($courseId) {
            $course = InstitutionCourse::find($courseId);
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
            $completedBlockIds = BlockCompletion::where('user_id', $user->id)
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
        $user = $request->user();

        $existing = TopicCompletion::where('user_id', $user->id)
            ->where('canonical_topic_id', $topic->id)
            ->first();

        if ($existing) {
            $existing->delete();
        } else {
            TopicCompletion::create([
                'user_id' => $user->id,
                'canonical_topic_id' => $topic->id,
                'completed_at' => now(),
            ]);
        }

        return back();
    }

    public function toggleBlockComplete(ContentBlock $block, Request $request): RedirectResponse
    {
        $request->validate([
            'reading_time_seconds' => ['nullable', 'integer', 'min:0'],
        ]);

        $user = $request->user();

        $existing = BlockCompletion::where('user_id', $user->id)
            ->where('content_block_id', $block->id)
            ->first();

        if ($existing) {
            $existing->delete();
        } else {
            BlockCompletion::create([
                'user_id' => $user->id,
                'content_block_id' => $block->id,
                'completed_at' => now(),
                'reading_time_seconds' => $request->integer('reading_time_seconds') ?: null,
            ]);
        }

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
