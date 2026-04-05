<?php

namespace App\Services\Student;

use App\Models\BlockCompletion;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\CourseTopicMapping;
use App\Models\InstitutionCourse;
use App\Models\QuestionTopicLink;
use App\Models\StudentProfile;
use App\Models\TopicCompletion;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class TopicBrowseService
{
    /**
     * @return array{
     *     topic_ids: Collection,
     *     course_ids: Collection,
     *     enrolled_course_ids: Collection
     * }
     */
    public function resolveTopicScope(StudentProfile $profile, bool $browseAll): array
    {
        $enrolledCourseIds = $profile
            ->studentCourses()
            ->where('is_archived', false)
            ->pluck('institution_course_id');

        $courseIds = $browseAll
            ? InstitutionCourse::query()->where('institution_id', $profile->institution_id)->pluck('id')
            : $enrolledCourseIds;

        $topicIds = CourseTopicMapping::query()->whereIn('institution_course_id', $courseIds)
            ->pluck('canonical_topic_id')
            ->unique();

        return [
            'topic_ids' => $topicIds,
            'course_ids' => $courseIds,
            'enrolled_course_ids' => $enrolledCourseIds,
        ];
    }

    /**
     * @param array{
     *     search?: string,
     *     difficulty?: string,
     *     course_id?: string,
     *     discipline_id?: string,
     *     completion?: string
     * } $filters
     */
    public function buildFilteredQuery(
        Collection $topicIds,
        Collection $completedTopicIds,
        array $filters,
        bool $browseAll,
    ): \Illuminate\Database\Eloquent\Builder {
        $query = CanonicalTopic::query()
            ->published()
            ->whereIn('id', $topicIds)
            ->with('discipline:id,name');

        if (! empty($filters['search'])) {
            $query->search($filters['search']);
        }

        if (! empty($filters['difficulty'])) {
            $query->where('difficulty_level', $filters['difficulty']);
        }

        if (! $browseAll && ! empty($filters['course_id'])) {
            $courseTopicIds = CourseTopicMapping::query()
                ->where('institution_course_id', $filters['course_id'])
                ->pluck('canonical_topic_id');
            $query->whereIn('id', $courseTopicIds);
        }

        if ($browseAll && ! empty($filters['discipline_id'])) {
            $query->where('discipline_id', $filters['discipline_id']);
        }

        if (! empty($filters['completion'])) {
            if ($filters['completion'] === 'completed') {
                $query->whereIn('id', $completedTopicIds);
            } elseif ($filters['completion'] === 'not_started') {
                $query->whereNotIn('id', $completedTopicIds);
            }
        }

        $query->orderBy('title');

        return $query;
    }

    public function getCompletedTopicIds(User $user, Collection $topicIds): Collection
    {
        return TopicCompletion::query()->where('user_id', $user->id)
            ->whereIn('canonical_topic_id', $topicIds)
            ->pluck('canonical_topic_id');
    }

    /**
     * @return array{
     *     block_counts: Collection,
     *     completed_block_counts: Collection,
     *     question_counts: Collection,
     *     courses_by_topic: Collection
     * }
     */
    public function getTopicAggregates(User $user, Collection $topicIds, Collection $courseIds): array
    {
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

        $questionCounts = QuestionTopicLink::query()
            ->whereIn('canonical_topic_id', $topicIds)
            ->whereHas('question', fn ($q) => $q->published())
            ->selectRaw('canonical_topic_id, count(*) as count')
            ->groupBy('canonical_topic_id')
            ->pluck('count', 'canonical_topic_id');

        $coursesByTopic = CourseTopicMapping::query()
            ->whereIn('canonical_topic_id', $topicIds)
            ->whereIn('institution_course_id', $courseIds)
            ->with('course:id,course_code,course_title')
            ->get()
            ->groupBy('canonical_topic_id')
            ->map(fn ($mappings) => $mappings->map(fn ($m) => [
                'id' => $m->course->id,
                'course_code' => $m->course->course_code,
                'course_title' => $m->course->course_title,
            ])->unique('id')->values());

        return [
            'block_counts' => $blockCounts,
            'completed_block_counts' => $completedBlockCounts,
            'question_counts' => $questionCounts,
            'courses_by_topic' => $coursesByTopic,
        ];
    }

    public function transformPaginatedTopics(LengthAwarePaginator $paginator, array $aggregates, Collection $completedTopicIds): void
    {
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
            'total_blocks' => $aggregates['block_counts'][$topic->id] ?? 0,
            'completed_blocks' => $aggregates['completed_block_counts'][$topic->id] ?? 0,
            'question_count' => $aggregates['question_counts'][$topic->id] ?? 0,
            'courses' => $aggregates['courses_by_topic'][$topic->id] ?? [],
        ]);
    }
}
