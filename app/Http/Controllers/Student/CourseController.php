<?php

namespace App\Http\Controllers\Student;

use App\Concerns\Paginates;
use App\Enums\QuestionStatus;
use App\Http\Controllers\Controller;
use App\Models\BlockCompletion;
use App\Models\ContentBlock;
use App\Models\InstitutionCourse;
use App\Models\TopicCompletion;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class CourseController extends Controller
{
    use Paginates;

    public function index(Request $request): Response
    {
        $user = $request->user();
        $profile = $user->studentProfile;

        $enrolledCourseIds = $profile
            ->studentCourses()
            ->where('is_archived', false)
            ->pluck('institution_course_id');

        $courses = InstitutionCourse::query()
            ->whereIn('id', $enrolledCourseIds)
            ->with(['institution:id,name,abbreviation', 'owningDepartment:id,name'])
            ->withCount([
                'topicMappings as topics_count',
                'questions as questions_count' => fn ($q) => $q->where('status', QuestionStatus::Published),
            ])
            ->get()
            ->map(function (InstitutionCourse $course) use ($user) {
                $topicIds = $course->topicMappings()->pluck('canonical_topic_id');
                $completedCount = TopicCompletion::where('user_id', $user->id)
                    ->whereIn('canonical_topic_id', $topicIds)
                    ->count();

                return [
                    'id' => $course->id,
                    'course_code' => $course->course_code,
                    'course_title' => $course->course_title,
                    'level' => $course->level,
                    'semester' => $course->semester?->value,
                    'institution' => $course->institution ? [
                        'id' => $course->institution->id,
                        'name' => $course->institution->name,
                        'abbreviation' => $course->institution->abbreviation,
                    ] : null,
                    'topics_count' => $course->topics_count,
                    'questions_count' => $course->questions_count,
                    'completed_topics_count' => $completedCount,
                ];
            });

        return Inertia::render('courses/index', [
            'courses' => $courses,
        ]);
    }

    public function show(InstitutionCourse $course, Request $request): Response|HttpResponse
    {
        $user = $request->user();
        $profile = $user->studentProfile;

        $isEnrolled = $profile->studentCourses()
            ->where('institution_course_id', $course->id)
            ->where('is_archived', false)
            ->exists();

        if (! $isEnrolled) {
            abort(403, 'You are not enrolled in this course.');
        }

        $course->load(['institution:id,name,abbreviation', 'owningDepartment:id,name']);

        $activeTab = $request->string('tab', 'topics')->value();

        $tabData = match ($activeTab) {
            'past_questions' => $this->getPastQuestionsData($course, $request),
            default => $this->getTopicsData($course, $user),
        };

        return Inertia::render('courses/show', [
            'course' => [
                'id' => $course->id,
                'course_code' => $course->course_code,
                'course_title' => $course->course_title,
                'level' => $course->level,
                'semester' => $course->semester?->value,
                'institution' => $course->institution ? [
                    'id' => $course->institution->id,
                    'name' => $course->institution->name,
                    'abbreviation' => $course->institution->abbreviation,
                ] : null,
            ],
            'activeTab' => $activeTab,
            ...$tabData,
        ]);
    }

    /** @return array<string, mixed> */
    private function getTopicsData(InstitutionCourse $course, mixed $user): array
    {
        $mappings = $course->topicMappings()
            ->with(['topic:id,title,slug,difficulty_level,estimated_read_minutes'])
            ->orderBy('sequence_order')
            ->get();

        $topicIds = $mappings->pluck('canonical_topic_id');
        $completedTopicIds = TopicCompletion::where('user_id', $user->id)
            ->whereIn('canonical_topic_id', $topicIds)
            ->pluck('canonical_topic_id')
            ->toArray();

        $questionCountsByTopic = \App\Models\QuestionTopicLink::query()
            ->whereIn('canonical_topic_id', $topicIds)
            ->whereHas('question', fn ($q) => $q->where('institution_course_id', $course->id)->published())
            ->selectRaw('canonical_topic_id, count(*) as count')
            ->groupBy('canonical_topic_id')
            ->pluck('count', 'canonical_topic_id');

        $blockCounts = ContentBlock::query()
            ->whereIn('canonical_topic_id', $topicIds)
            ->where('is_published', true)
            ->where('is_container', false)
            ->selectRaw('canonical_topic_id, count(*) as total')
            ->groupBy('canonical_topic_id')
            ->pluck('total', 'canonical_topic_id');

        $completedBlockCounts = BlockCompletion::query()
            ->where('user_id', $user->id)
            ->join('content_blocks', 'block_completions.content_block_id', '=', 'content_blocks.id')
            ->whereIn('content_blocks.canonical_topic_id', $topicIds)
            ->where('content_blocks.is_published', true)
            ->where('content_blocks.is_container', false)
            ->selectRaw('content_blocks.canonical_topic_id, count(*) as completed')
            ->groupBy('content_blocks.canonical_topic_id')
            ->pluck('completed', 'content_blocks.canonical_topic_id');

        $topics = $mappings->map(fn ($mapping) => [
            'id' => $mapping->canonical_topic_id,
            'sequence_order' => $mapping->sequence_order,
            'weight' => $mapping->weight?->value,
            'title' => $mapping->topic->title,
            'slug' => $mapping->topic->slug,
            'difficulty_level' => $mapping->topic->difficulty_level?->value,
            'estimated_read_minutes' => $mapping->topic->estimated_read_minutes,
            'is_completed' => in_array($mapping->canonical_topic_id, $completedTopicIds),
            'question_count' => $questionCountsByTopic[$mapping->canonical_topic_id] ?? 0,
            'total_blocks' => $blockCounts[$mapping->canonical_topic_id] ?? 0,
            'completed_blocks' => $completedBlockCounts[$mapping->canonical_topic_id] ?? 0,
        ]);

        $completedCount = count(array_intersect($topicIds->toArray(), $completedTopicIds));

        return [
            'topics' => $topics,
            'topicsProgress' => [
                'completed' => $completedCount,
                'total' => $mappings->count(),
                'total_blocks' => $blockCounts->sum(),
                'completed_blocks' => $completedBlockCounts->sum(),
            ],
        ];
    }

    /** @return array<string, mixed> */
    private function getPastQuestionsData(InstitutionCourse $course, Request $request): array
    {
        $query = $course->questions()
            ->published()
            ->with([
                'topicLinks.canonicalTopic:id,title',
                'answers' => fn ($q) => $q->where('is_published', true),
            ]);

        if ($request->filled('year')) {
            $query->byYear((int) $request->string('year')->value());
        }

        if ($request->filled('semester')) {
            $query->bySemester($request->string('semester')->value());
        }

        if ($request->filled('topic')) {
            $query->whereHas('topicLinks', fn ($q) => $q->where('canonical_topic_id', $request->string('topic')->value()));
        }

        if ($request->filled('difficulty')) {
            $query->byDifficulty($request->string('difficulty')->value());
        }

        if ($request->filled('type')) {
            $query->byType($request->string('type')->value());
        }

        $query->orderByDesc('year')->orderByDesc('created_at');

        $paginator = $query->paginate(self::DEFAULT_PER_PAGE);

        $topicMappings = $course->topicMappings()
            ->with('topic:id,title')
            ->get()
            ->map(fn ($m) => ['id' => $m->canonical_topic_id, 'title' => $m->topic->title]);

        $years = $course->questions()
            ->published()
            ->whereNotNull('year')
            ->distinct()
            ->orderByDesc('year')
            ->pluck('year');

        return [
            'questions' => $this->paginated($paginator),
            'filterOptions' => [
                'topics' => $topicMappings,
                'years' => $years,
            ],
            'appliedFilters' => [
                'year' => $request->string('year')->value() ?: null,
                'semester' => $request->string('semester')->value() ?: null,
                'topic' => $request->string('topic')->value() ?: null,
                'difficulty' => $request->string('difficulty')->value() ?: null,
                'type' => $request->string('type')->value() ?: null,
            ],
        ];
    }
}
