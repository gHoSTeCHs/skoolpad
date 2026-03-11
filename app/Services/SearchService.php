<?php

namespace App\Services;

use App\Models\CanonicalTopic;
use App\Models\InstitutionCourse;
use App\Models\Question;
use App\Models\StudentNote;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class SearchService
{
    /** @return array{topics: Collection, courses: Collection, questions: Collection, notes: Collection, total: int} */
    public function search(string $query, string $userId, ?string $institutionId = null, int $limit = 8): array
    {
        $topics = $this->searchTopics($query, $limit);
        $courses = $this->searchCourses($query, $institutionId, $limit);
        $questions = $this->searchQuestions($query, $limit);
        $notes = $this->searchNotes($query, $userId, $limit);

        return [
            'topics' => $topics,
            'courses' => $courses,
            'questions' => $questions,
            'notes' => $notes,
            'total' => $topics->count() + $courses->count() + $questions->count() + $notes->count(),
        ];
    }

    private function searchTopics(string $query, int $limit): Collection
    {
        return CanonicalTopic::query()
            ->fullTextSearch($query)
            ->published()
            ->selectRaw("*, ts_rank(search_vector, plainto_tsquery('english', ?)) as relevance", [$query])
            ->with('discipline:id,name')
            ->orderByDesc('relevance')
            ->limit($limit)
            ->get()
            ->map(fn (CanonicalTopic $topic) => [
                'id' => $topic->id,
                'title' => $topic->title,
                'subtitle' => $topic->discipline?->name ?? '',
                'description' => $topic->summary ? Str::limit($topic->summary, 120) : '',
                'type' => 'topic',
                'url' => route('topics.show', $topic->id),
            ]);
    }

    private function searchCourses(string $query, ?string $institutionId, int $limit): Collection
    {
        if (! $institutionId) {
            return collect();
        }

        return InstitutionCourse::query()
            ->search($query)
            ->where('institution_id', $institutionId)
            ->select('id', 'course_code', 'course_title', 'institution_id')
            ->with('institution:id,abbreviation')
            ->limit($limit)
            ->get()
            ->map(fn (InstitutionCourse $course) => [
                'id' => $course->id,
                'title' => $course->course_code,
                'subtitle' => $course->course_title,
                'description' => $course->institution?->abbreviation ?? '',
                'type' => 'course',
                'url' => route('courses.show', $course->id),
            ]);
    }

    private function searchQuestions(string $query, int $limit): Collection
    {
        return Question::query()
            ->search($query)
            ->published()
            ->selectRaw("*, ts_rank(search_vector, plainto_tsquery('english', ?)) as relevance", [$query])
            ->with('institutionCourse:id,course_code')
            ->orderByDesc('relevance')
            ->limit($limit)
            ->get()
            ->map(fn (Question $question) => [
                'id' => $question->id,
                'title' => Str::limit(strip_tags($question->content), 80),
                'subtitle' => $question->institutionCourse?->course_code ?? 'General',
                'description' => $question->question_type->label(),
                'type' => 'question',
                'url' => route('questions.show', $question->id),
            ]);
    }

    private function searchNotes(string $query, string $userId, int $limit): Collection
    {
        return StudentNote::query()
            ->where('user_id', $userId)
            ->search($query)
            ->select('id', 'title', 'updated_at')
            ->latest('updated_at')
            ->limit($limit)
            ->get()
            ->map(fn (StudentNote $note) => [
                'id' => $note->id,
                'title' => $note->title,
                'subtitle' => 'Note',
                'description' => $note->updated_at->diffForHumans(),
                'type' => 'note',
                'url' => route('notes.show', $note->id),
            ]);
    }
}
