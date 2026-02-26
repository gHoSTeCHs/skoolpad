<?php

namespace App\Http\Controllers\Student;

use App\Concerns\Paginates;
use App\Http\Controllers\Controller;
use App\Models\InstitutionCourse;
use App\Models\QuestionPaper;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class QuestionPaperController extends Controller
{
    use Paginates;

    public function index(Request $request): Response
    {
        $user = $request->user();
        $profile = $user->studentProfile;

        $enrolledCourseIds = $profile->studentCourses()
            ->where('is_archived', false)
            ->pluck('institution_course_id');

        $papers = QuestionPaper::query()
            ->published()
            ->whereIn('institution_course_id', $enrolledCourseIds)
            ->with([
                'institutionCourse:id,institution_id,course_code,course_title',
                'institutionCourse.institution:id,name,abbreviation',
                'assessmentType:id,name',
            ])
            ->withCount(['sections', 'questions'])
            ->when($request->filled('course_id'), fn ($q) => $q->where('institution_course_id', $request->string('course_id')))
            ->when($request->filled('year'), fn ($q) => $q->where('year', (int) $request->string('year')->value()))
            ->when($request->filled('semester'), fn ($q) => $q->where('semester', 'ilike', "%{$request->string('semester')}%"))
            ->orderByDesc('year')
            ->orderByDesc('created_at')
            ->paginate(self::DEFAULT_PER_PAGE)
            ->withQueryString();

        $paperCount = QuestionPaper::query()
            ->published()
            ->whereIn('institution_course_id', $enrolledCourseIds)
            ->count();

        $courses = InstitutionCourse::query()
            ->whereIn('id', $enrolledCourseIds)
            ->orderBy('course_code')
            ->get(['id', 'course_code', 'course_title']);

        $years = QuestionPaper::query()
            ->published()
            ->whereIn('institution_course_id', $enrolledCourseIds)
            ->whereNotNull('year')
            ->distinct()
            ->orderByDesc('year')
            ->pluck('year');

        return Inertia::render('questions/index', [
            'tab' => 'papers',
            'papers' => $this->paginated($papers),
            'paperFilterOptions' => [
                'courses' => $courses,
                'years' => $years,
            ],
            'paperFilters' => array_filter([
                'course_id' => $request->string('course_id')->value() ?: null,
                'year' => $request->string('year')->value() ?: null,
                'semester' => $request->string('semester')->value() ?: null,
            ]),
            'paperCount' => $paperCount,
        ]);
    }

    public function show(QuestionPaper $questionPaper, Request $request): Response
    {
        $user = $request->user();
        $profile = $user->studentProfile;

        $enrolledCourseIds = $profile->studentCourses()
            ->where('is_archived', false)
            ->pluck('institution_course_id');

        if (! $enrolledCourseIds->contains($questionPaper->institution_course_id)) {
            abort(403, 'You are not enrolled in the course for this paper.');
        }

        if (! $questionPaper->is_published) {
            abort(404);
        }

        $questionPaper->load([
            'institutionCourse:id,institution_id,course_code,course_title',
            'institutionCourse.institution:id,name,abbreviation',
            'assessmentType:id,name',
            'sections' => fn ($q) => $q->orderBy('sort_order'),
            'sections.questions' => fn ($q) => $q->whereNull('parent_question_id')->orderBy('sort_order'),
            'sections.questions.children' => fn ($q) => $q->orderBy('sort_order'),
            'sections.questions.children.children' => fn ($q) => $q->orderBy('sort_order'),
            'sections.questions.children.children.children' => fn ($q) => $q->orderBy('sort_order'),
            'sections.questions.answers' => fn ($q) => $q->where('is_published', true),
            'sections.questions.children.answers' => fn ($q) => $q->where('is_published', true),
            'sections.questions.children.children.answers' => fn ($q) => $q->where('is_published', true),
            'sections.questions.children.children.children.answers' => fn ($q) => $q->where('is_published', true),
            'sections.questions.questionContextLinks',
            'contexts',
        ]);

        return Inertia::render('questions/papers/show', [
            'paper' => $questionPaper,
        ]);
    }
}
