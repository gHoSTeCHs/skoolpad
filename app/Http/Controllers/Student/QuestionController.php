<?php

namespace App\Http\Controllers\Student;

use App\Concerns\Paginates;
use App\Http\Controllers\Controller;
use App\Models\InstitutionCourse;
use App\Models\Question;
use App\Services\QuestionBrowseService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class QuestionController extends Controller
{
    use Paginates;

    public function __construct(
        private QuestionBrowseService $browseService
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $profile = $user->studentProfile;

        $browseAll = $request->boolean('browse_all');

        $courseIds = $browseAll
            ? InstitutionCourse::where('institution_id', $profile->institution_id)->pluck('id')
            : $profile->studentCourses()->where('is_archived', false)->pluck('institution_course_id');

        $filters = [
            'course_ids' => $courseIds->toArray(),
            'institution_id' => $request->string('institution_id')->value() ?: null,
            'course_id' => $request->string('course_id')->value() ?: null,
            'year' => $request->string('year')->value() ?: null,
            'semester' => $request->string('semester')->value() ?: null,
            'topic_id' => $request->string('topic_id')->value() ?: null,
            'difficulty' => $request->string('difficulty')->value() ?: null,
            'type' => $request->string('type')->value() ?: null,
            'search' => $request->string('search')->value() ?: null,
        ];

        $results = $this->browseService->search($filters, $user, self::DEFAULT_PER_PAGE);
        $filterOptions = $this->browseService->getFilterOptions(
            $courseIds,
            $filters['institution_id'],
            $filters['course_id']
        );

        $totalCount = Question::query()
            ->published()
            ->whereIn('institution_course_id', $courseIds)
            ->count();

        return Inertia::render('questions/index', [
            'tab' => 'search',
            'questions' => $this->cursorPaginated($results),
            'filterOptions' => $filterOptions,
            'appliedFilters' => array_filter([
                'institution_id' => $filters['institution_id'],
                'course_id' => $filters['course_id'],
                'year' => $filters['year'],
                'semester' => $filters['semester'],
                'topic_id' => $filters['topic_id'],
                'difficulty' => $filters['difficulty'],
                'type' => $filters['type'],
                'search' => $filters['search'],
                'browse_all' => $browseAll ? 'true' : null,
            ]),
            'totalCount' => $totalCount,
        ]);
    }

    public function show(Question $question, Request $request): Response
    {
        $user = $request->user();
        $profile = $user->studentProfile;

        $enrolledCourseIds = $profile->studentCourses()
            ->where('is_archived', false)
            ->pluck('institution_course_id');

        if (! $enrolledCourseIds->contains($question->institution_course_id)) {
            abort(403, 'You are not enrolled in the course for this question.');
        }

        $question->load([
            'institutionCourse:id,course_code,course_title,institution_id',
            'institutionCourse.institution:id,name,abbreviation',
            'topicLinks.canonicalTopic:id,title',
            'answers' => fn ($q) => $q->where('is_published', true),
        ]);

        return Inertia::render('questions/show', [
            'question' => $question,
        ]);
    }
}
