<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\BlockCompletion;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\CourseTopicMapping;
use App\Models\InstitutionCourse;
use App\Models\TopicCompletion;
use App\Services\PrerequisiteGapService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TopicController extends Controller
{
    public function __construct(
        private PrerequisiteGapService $prerequisiteService
    ) {}

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
            ->whereHas('topicLinks', fn ($q) => $q->where('canonical_topic_id', $topic->id))
            ->when($courseId, fn ($q) => $q->where('institution_course_id', $courseId))
            ->with(['topicLinks.canonicalTopic:id,title', 'answers' => fn ($q) => $q->where('is_published', true)])
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
