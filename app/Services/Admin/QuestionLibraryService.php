<?php

namespace App\Services\Admin;

use App\Enums\QuestionStatus;
use App\Models\ExamSubject;
use App\Models\InstitutionCourse;
use App\Models\Question;
use App\Models\QuestionAnswer;
use App\Models\QuestionPaper;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class QuestionLibraryService
{
    /**
     * Headline counts for the Library landing.
     *
     * @return array<string, int>
     */
    public function getCounts(): array
    {
        return [
            'total_questions' => Question::query()->count(),
            'papers' => QuestionPaper::query()->count(),
            'course_pools' => InstitutionCourse::query()
                ->whereHas('questions', fn ($q) => $q->whereNull('question_paper_id'))
                ->count(),
            'exam_subject_pools' => ExamSubject::query()
                ->whereHas('questions', fn ($q) => $q->whereNull('question_paper_id'))
                ->count(),
            'unattached' => Question::query()
                ->whereNull('question_paper_id')
                ->whereNull('institution_course_id')
                ->whereNull('exam_subject_id')
                ->count(),
        ];
    }

    /**
     * Papers with stats: section/question/context counts + answer fill ratios.
     *
     * @param  array<string, mixed>  $filters  search, status
     * @return Collection<int, array<string, mixed>>
     */
    public function getPapersWithStats(array $filters = []): Collection
    {
        $papers = QuestionPaper::query()
            ->with([
                'institutionCourse:id,institution_id,course_code,course_title',
                'institutionCourse.institution:id,name,abbreviation',
                'assessmentType:id,name',
            ])
            ->withCount(['sections', 'questions', 'contexts'])
            ->when(! empty($filters['search']), fn ($q) => $q->search($filters['search']))
            ->when(($filters['status'] ?? null) === 'published', fn ($q) => $q->where('is_published', true))
            ->when(($filters['status'] ?? null) === 'draft', fn ($q) => $q->where('is_published', false))
            ->latest('updated_at')
            ->get();

        $paperIds = $papers->pluck('id');

        $answerStats = $this->aggregateAnswerStatsForPapers($paperIds);

        return $papers->map(function (QuestionPaper $paper) use ($answerStats) {
            $stats = $answerStats[$paper->id] ?? ['filled' => 0, 'published' => 0];
            $totalSlots = max(0, (int) $paper->questions_count) * 3;
            $filled = (int) $stats['filled'];
            $published = (int) $stats['published'];
            $completePercent = $totalSlots > 0 ? (int) round(($filled / $totalSlots) * 100) : 0;

            return [
                'id' => $paper->id,
                'title' => $paper->title,
                'course_code' => $paper->institutionCourse?->course_code,
                'institution_abbreviation' => $paper->institutionCourse?->institution?->abbreviation,
                'assessment_type_name' => $paper->assessmentType?->name,
                'year' => $paper->year,
                'total_marks' => $paper->total_marks,
                'is_published' => $paper->is_published,
                'questions_count' => (int) $paper->questions_count,
                'sections_count' => (int) $paper->sections_count,
                'contexts_count' => (int) $paper->contexts_count,
                'answers_filled' => $filled,
                'answers_published' => $published,
                'answers_total_slots' => $totalSlots,
                'complete_percent' => $completePercent,
                'updated_at' => $paper->updated_at?->toISOString(),
            ];
        });
    }

    /**
     * Course pools: institution courses with ≥1 question lacking a paper.
     *
     * @param  array<string, mixed>  $filters  search
     * @return Collection<int, array<string, mixed>>
     */
    public function getCoursePools(array $filters = []): Collection
    {
        return InstitutionCourse::query()
            ->with(['institution:id,name,abbreviation'])
            ->withCount([
                'questions as pool_questions_count' => fn ($q) => $q->whereNull('question_paper_id'),
            ])
            ->whereHas('questions', fn ($q) => $q->whereNull('question_paper_id'))
            ->when(! empty($filters['search']), fn ($q) => $q->search($filters['search']))
            ->latest('updated_at')
            ->get()
            ->map(fn (InstitutionCourse $course) => [
                'id' => $course->id,
                'course_code' => $course->course_code,
                'course_title' => $course->course_title,
                'institution_abbreviation' => $course->institution?->abbreviation,
                'institution_name' => $course->institution?->name,
                'pool_questions_count' => (int) $course->pool_questions_count,
                'updated_at' => $course->updated_at?->toISOString(),
            ]);
    }

    /**
     * Exam-subject pools: subjects with ≥1 question lacking a paper.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function getExamSubjectPools(): Collection
    {
        return ExamSubject::query()
            ->withCount([
                'questions as pool_questions_count' => fn ($q) => $q->whereNull('question_paper_id'),
            ])
            ->whereHas('questions', fn ($q) => $q->whereNull('question_paper_id'))
            ->orderBy('name')
            ->get()
            ->map(fn (ExamSubject $subject) => [
                'id' => $subject->id,
                'name' => $subject->name,
                'pool_questions_count' => (int) $subject->pool_questions_count,
            ]);
    }

    /**
     * Questions with no paper, no course, no exam-subject — pure orphans.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function getUnattachedQuestions(): Collection
    {
        return Question::query()
            ->select(['id', 'question_type', 'status', 'difficulty_level', 'content', 'created_at', 'updated_at'])
            ->whereNull('question_paper_id')
            ->whereNull('institution_course_id')
            ->whereNull('exam_subject_id')
            ->latest('updated_at')
            ->get()
            ->map(fn (Question $question) => [
                'id' => $question->id,
                'question_type' => $question->question_type,
                'status' => $question->status?->value ?? $question->getRawOriginal('status'),
                'difficulty_level' => $question->difficulty_level,
                'stem_preview' => $this->extractStem($question->content),
                'updated_at' => $question->updated_at?->toISOString(),
            ]);
    }

    /**
     * ⌘K search: across papers, course pools, exam-subject pools, and question stems.
     *
     * @return array<string, array<int, array<string, mixed>>>
     */
    public function globalSearch(string $term): array
    {
        $term = trim($term);
        if ($term === '') {
            return ['papers' => [], 'course_pools' => [], 'exam_pools' => [], 'questions' => []];
        }

        $papers = QuestionPaper::query()
            ->with(['institutionCourse:id,course_code'])
            ->search($term)
            ->limit(8)
            ->get(['id', 'title', 'year', 'institution_course_id'])
            ->map(fn (QuestionPaper $p) => [
                'id' => $p->id,
                'title' => $p->title,
                'year' => $p->year,
                'course_code' => $p->institutionCourse?->course_code,
            ])
            ->all();

        $coursePools = InstitutionCourse::query()
            ->search($term)
            ->whereHas('questions', fn ($q) => $q->whereNull('question_paper_id'))
            ->limit(8)
            ->get(['id', 'course_code', 'course_title'])
            ->map(fn (InstitutionCourse $c) => [
                'id' => $c->id,
                'course_code' => $c->course_code,
                'course_title' => $c->course_title,
            ])
            ->all();

        $examPools = ExamSubject::query()
            ->search($term)
            ->whereHas('questions', fn ($q) => $q->whereNull('question_paper_id'))
            ->limit(8)
            ->get(['id', 'name'])
            ->map(fn (ExamSubject $s) => [
                'id' => $s->id,
                'name' => $s->name,
            ])
            ->all();

        $questions = Question::query()
            ->select(['id', 'question_type', 'question_paper_id', 'institution_course_id', 'content'])
            ->search($term)
            ->limit(12)
            ->get()
            ->map(fn (Question $q) => [
                'id' => $q->id,
                'question_type' => $q->question_type,
                'stem_preview' => $this->extractStem($q->content),
                'question_paper_id' => $q->question_paper_id,
                'institution_course_id' => $q->institution_course_id,
            ])
            ->all();

        return [
            'papers' => $papers,
            'course_pools' => $coursePools,
            'exam_pools' => $examPools,
            'questions' => $questions,
        ];
    }

    /**
     * Build payload for a course pool — questions on a course without a paper, grouped by primary canonical topic.
     *
     * @return array<string, mixed>
     */
    public function getCoursePoolBuild(InstitutionCourse $course): array
    {
        $course->load(['institution:id,name,abbreviation']);

        $questions = Question::query()
            ->where('institution_course_id', $course->id)
            ->whereNull('question_paper_id')
            ->whereNull('parent_question_id')
            ->with([
                'answers',
                'topicLinks.canonicalTopic:id,title',
                'questionBlockLinks.contentBlock:id,title',
                'children' => fn ($q) => $q->orderBy('sort_order'),
                'children.answers',
                'children.topicLinks.canonicalTopic:id,title',
                'children.questionBlockLinks.contentBlock:id,title',
                'children.children' => fn ($q) => $q->orderBy('sort_order'),
                'children.children.answers',
                'children.children.topicLinks.canonicalTopic:id,title',
                'children.children.questionBlockLinks.contentBlock:id,title',
                'children.children.children' => fn ($q) => $q->orderBy('sort_order'),
                'children.children.children.answers',
                'children.children.children.topicLinks.canonicalTopic:id,title',
                'children.children.children.questionBlockLinks.contentBlock:id,title',
                'questionContextLinks',
            ])
            ->orderBy('sort_order')
            ->get();

        $topicBuckets = [];
        foreach ($questions as $question) {
            $primary = $question->topicLinks->firstWhere('is_primary', true) ?? $question->topicLinks->first();
            $topicId = $primary?->canonical_topic_id ?? 'untagged';
            $topicTitle = $primary?->canonicalTopic?->title ?? 'Untagged';

            if (! isset($topicBuckets[$topicId])) {
                $topicBuckets[$topicId] = [
                    'id' => $topicId,
                    'title' => $topicTitle,
                    'questions' => [],
                ];
            }

            $topicBuckets[$topicId]['questions'][] = $question;
        }

        $topics = array_values($topicBuckets);
        usort($topics, fn ($a, $b) => $a['id'] === 'untagged' ? 1 : ($b['id'] === 'untagged' ? -1 : strcmp($a['title'], $b['title'])));

        return [
            'id' => $course->id,
            'course_code' => $course->course_code,
            'course_title' => $course->course_title,
            'institution_name' => $course->institution?->name,
            'institution_abbreviation' => $course->institution?->abbreviation,
            'topics' => $topics,
            'questions_total' => $questions->count(),
        ];
    }

    /**
     * Aggregate per-paper answer fill stats: count of answers (filled) and is_published=true.
     *
     * @param  Collection<int, string>  $paperIds
     * @return array<string, array{filled: int, published: int}>
     */
    private function aggregateAnswerStatsForPapers(Collection $paperIds): array
    {
        if ($paperIds->isEmpty()) {
            return [];
        }

        $rows = QuestionAnswer::query()
            ->join('questions', 'question_answers.question_id', '=', 'questions.id')
            ->whereIn('questions.question_paper_id', $paperIds)
            ->groupBy('questions.question_paper_id')
            ->select([
                'questions.question_paper_id as paper_id',
                DB::raw('count(*) as filled'),
                DB::raw("count(*) filter (where question_answers.is_published = true) as published"),
            ])
            ->get();

        $stats = [];
        foreach ($rows as $row) {
            $stats[$row->paper_id] = [
                'filled' => (int) $row->filled,
                'published' => (int) $row->published,
            ];
        }

        return $stats;
    }

    private function extractStem(mixed $content): string
    {
        if (! is_array($content)) {
            return '';
        }

        $text = $this->collectText($content);
        $stripped = trim(preg_replace('/\s+/', ' ', $text) ?? '');

        return mb_strlen($stripped) > 140 ? mb_substr($stripped, 0, 140).'…' : $stripped;
    }

    private function collectText(array $node): string
    {
        $out = '';
        if (isset($node['text']) && is_string($node['text'])) {
            $out .= $node['text'].' ';
        }
        if (isset($node['content']) && is_array($node['content'])) {
            foreach ($node['content'] as $child) {
                if (is_array($child)) {
                    $out .= $this->collectText($child);
                }
            }
        }

        return $out;
    }
}
