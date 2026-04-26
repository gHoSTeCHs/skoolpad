<?php

namespace App\Services\Student;

use App\Models\CanonicalTopic;
use App\Models\CourseTopicMapping;
use App\Models\InstitutionCourse;
use App\Models\Question;
use App\Models\StudentProfile;
use Illuminate\Support\Collection;

class TopicContentService
{
    /**
     * @return array{
     *     course: array{id: string, course_code: string, course_title: string}|null,
     *     prev_topic: array{id: string, title: string}|null,
     *     next_topic: array{id: string, title: string}|null,
     * }
     */
    public function getCourseContext(CanonicalTopic $topic, string $courseId, StudentProfile $profile): array
    {
        $isEnrolled = $profile->studentCourses()
            ->where('institution_course_id', $courseId)
            ->exists();

        $course = $isEnrolled
            ? InstitutionCourse::query()->find($courseId)
            : null;

        if (! $course) {
            return ['course' => null, 'prev_topic' => null, 'next_topic' => null];
        }

        $currentMapping = CourseTopicMapping::query()
            ->where('institution_course_id', $courseId)
            ->where('canonical_topic_id', $topic->id)
            ->first();

        $prevTopic = null;
        $nextTopic = null;

        if ($currentMapping) {
            $prevMapping = CourseTopicMapping::query()
                ->where('institution_course_id', $courseId)
                ->where('sequence_order', '<', $currentMapping->sequence_order)
                ->orderByDesc('sequence_order')
                ->with('topic:id,title')
                ->first();

            $nextMapping = CourseTopicMapping::query()
                ->where('institution_course_id', $courseId)
                ->where('sequence_order', '>', $currentMapping->sequence_order)
                ->orderBy('sequence_order')
                ->with('topic:id,title')
                ->first();

            $prevTopic = $prevMapping?->topic
                ? ['id' => $prevMapping->topic->id, 'title' => $prevMapping->topic->title]
                : null;

            $nextTopic = $nextMapping?->topic
                ? ['id' => $nextMapping->topic->id, 'title' => $nextMapping->topic->title]
                : null;
        }

        return [
            'course' => [
                'id' => $course->id,
                'course_code' => $course->course_code,
                'course_title' => $course->course_title,
            ],
            'prev_topic' => $prevTopic,
            'next_topic' => $nextTopic,
        ];
    }

    /**
     * Returns questions related to the topic, shaped for student consumption.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function getRelatedQuestions(CanonicalTopic $topic, ?string $courseId): Collection
    {
        $questions = Question::query()
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

        return $questions->map(fn (Question $q) => $this->shapeQuestion($q));
    }

    public function countCrossInstitutionQuestions(CanonicalTopic $topic): int
    {
        return Question::query()
            ->published()
            ->whereNull('parent_question_id')
            ->whereHas('topicLinks', fn ($q) => $q->where('canonical_topic_id', $topic->id))
            ->count();
    }

    /** @return array<string, mixed> */
    private function shapeQuestion(Question $question): array
    {
        return [
            'id' => $question->id,
            'question_type' => $question->question_type->value,
            'question_number' => $question->question_number,
            'display_label' => $question->display_label,
            'content' => $question->content,
            'marks' => $question->marks,
            'difficulty_level' => $question->difficulty_level?->value,
            'year' => $question->year,
            'sort_order' => $question->sort_order,
            'depth_level' => $question->depth_level,
            'response_config' => $question->response_config,
            'topic_links' => $question->topicLinks->map(fn ($link) => [
                'canonical_topic' => $link->canonicalTopic
                    ? ['id' => $link->canonicalTopic->id, 'title' => $link->canonicalTopic->title]
                    : null,
            ])->values()->all(),
            'answers' => $question->answers->map(fn ($a) => [
                'id' => $a->id,
                'depth_level' => $a->depth_level?->value,
                'content' => $a->content,
            ])->values()->all(),
            'children' => $question->children->map(fn ($child) => $this->shapeQuestion($child))->values()->all(),
        ];
    }
}
