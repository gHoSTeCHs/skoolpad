<?php

namespace App\Services;

use App\Models\InstitutionCourse;
use App\Models\Question;
use App\Models\User;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Support\Collection;

class QuestionBrowseService
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function search(array $filters, User $user, int $perPage = 15): CursorPaginator
    {
        $query = Question::query()->published();

        if (! empty($filters['course_ids'])) {
            $query->whereIn('institution_course_id', $filters['course_ids']);
        }

        if (! empty($filters['institution_id'])) {
            $query->forInstitution($filters['institution_id']);
        }

        if (! empty($filters['course_id'])) {
            $query->forCourse($filters['course_id']);
        }

        if (! empty($filters['year'])) {
            $query->byYear((int) $filters['year']);
        }

        if (! empty($filters['semester'])) {
            $query->bySemester($filters['semester']);
        }

        if (! empty($filters['topic_id'])) {
            $query->whereHas('topicLinks', fn ($q) => $q->where('canonical_topic_id', $filters['topic_id']));
        }

        if (! empty($filters['difficulty'])) {
            $query->byDifficulty($filters['difficulty']);
        }

        if (! empty($filters['type'])) {
            $query->byType($filters['type']);
        }

        $query->with([
            'institutionCourse:id,course_code,course_title,institution_id',
            'institutionCourse.institution:id,name,abbreviation',
            'topicLinks.canonicalTopic:id,title',
            'answers' => fn ($q) => $q->where('is_published', true),
        ]);

        if (! empty($filters['search'])) {
            $query->search($filters['search']);
            $query->orderByRaw("ts_rank(search_vector, plainto_tsquery('english', ?)) DESC", [$filters['search']]);
        } else {
            $query->orderByDesc('year')->orderByDesc('created_at');
        }

        return $query->cursorPaginate($perPage);
    }

    /**
     * @param  Collection<int, string>  $enrolledCourseIds
     * @return array{institutions: array<int, array<string, string>>, courses: array<int, array<string, string>>, years: array<int, int>, topics: array<int, array<string, string>>}
     */
    public function getFilterOptions(Collection $enrolledCourseIds, ?string $institutionId = null, ?string $courseId = null): array
    {
        $institutions = InstitutionCourse::query()
            ->whereIn('id', $enrolledCourseIds)
            ->with('institution:id,name,abbreviation')
            ->get()
            ->pluck('institution')
            ->unique('id')
            ->map(fn ($inst) => ['id' => $inst->id, 'name' => $inst->name, 'abbreviation' => $inst->abbreviation])
            ->values()
            ->all();

        $coursesQuery = InstitutionCourse::query()->whereIn('id', $enrolledCourseIds);
        if ($institutionId) {
            $coursesQuery->where('institution_id', $institutionId);
        }
        $courses = $coursesQuery->get(['id', 'course_code', 'course_title'])
            ->map(fn ($c) => ['id' => $c->id, 'course_code' => $c->course_code, 'course_title' => $c->course_title])
            ->values()
            ->all();

        $yearsQuery = Question::query()->published()->whereIn('institution_course_id', $enrolledCourseIds);
        if ($courseId) {
            $yearsQuery->forCourse($courseId);
        }
        $years = $yearsQuery->whereNotNull('year')
            ->distinct()
            ->orderByDesc('year')
            ->pluck('year')
            ->all();

        $topicsQuery = \App\Models\QuestionTopicLink::query()
            ->whereHas('question', fn ($q) => $q->published()->whereIn('institution_course_id', $enrolledCourseIds));
        if ($courseId) {
            $topicsQuery->whereHas('question', fn ($q) => $q->forCourse($courseId));
        }
        $topicIds = $topicsQuery->distinct()->pluck('canonical_topic_id');
        $topics = \App\Models\CanonicalTopic::whereIn('id', $topicIds)
            ->orderBy('title')
            ->get(['id', 'title'])
            ->map(fn ($t) => ['id' => $t->id, 'title' => $t->title])
            ->values()
            ->all();

        return compact('institutions', 'courses', 'years', 'topics');
    }
}
