<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\Paginates;
use App\Enums\BloomLevel;
use App\Enums\ContextType;
use App\Enums\QuestionDifficulty;
use App\Enums\QuestionType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreQuestionPaperRequest;
use App\Http\Requests\Admin\UpdateQuestionPaperRequest;
use App\Models\AssessmentType;
use App\Models\Institution;
use App\Models\Question;
use App\Models\QuestionPaper;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class QuestionPaperController extends Controller
{
    use Paginates;

    public function index(Request $request): Response
    {
        Gate::authorize('managePapers', Question::class);

        $papers = QuestionPaper::query()
            ->with([
                'institutionCourse:id,institution_id,course_code,course_title',
                'institutionCourse.institution:id,name,abbreviation',
                'assessmentType:id,name',
            ])
            ->withCount(['sections', 'questions'])
            ->when($request->filled('institution_id'), fn ($q) => $q->whereHas('institutionCourse', fn ($sub) => $sub->where('institution_id', $request->string('institution_id'))))
            ->when($request->filled('assessment_type_id'), fn ($q) => $q->where('assessment_type_id', $request->string('assessment_type_id')))
            ->when($request->filled('year'), fn ($q) => $q->where('year', (int) $request->string('year')->value()))
            ->when($request->filled('search'), fn ($q) => $q->search($request->string('search')))
            ->tap(fn ($q) => $this->applySorting($q, $request, ['title', 'year', 'total_marks', 'created_at'], 'created_at', 'desc'))
            ->paginate(self::DEFAULT_PER_PAGE)
            ->withQueryString();

        $papers->through(fn ($paper) => [
            'id' => $paper->id,
            'title' => $paper->title,
            'academic_session' => $paper->academic_session,
            'semester' => $paper->semester,
            'year' => $paper->year,
            'total_marks' => $paper->total_marks,
            'duration_minutes' => $paper->duration_minutes,
            'is_published' => $paper->is_published,
            'course_code' => $paper->institutionCourse?->course_code,
            'institution_abbreviation' => $paper->institutionCourse?->institution?->abbreviation,
            'assessment_type_name' => $paper->assessmentType?->name,
            'sections_count' => $paper->sections_count,
            'questions_count' => $paper->questions_count,
            'created_at' => $paper->created_at,
        ]);

        return Inertia::render('admin/question-papers/index', [
            'papers' => $this->paginated($papers),
            'institutions' => cache()->remember('ref.institutions.active', now()->addHour(), fn () => Institution::query()->where('is_active', true)->orderBy('abbreviation')->get(['id', 'name', 'abbreviation'])),
            'assessment_types' => AssessmentType::query()->orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['search', 'institution_id', 'assessment_type_id', 'year', 'sort', 'direction']),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('managePapers', Question::class);

        return Inertia::render('admin/question-papers/create', [
            'institutions' => cache()->remember('ref.institutions.active', now()->addHour(), fn () => Institution::query()->where('is_active', true)->orderBy('abbreviation')->get(['id', 'name', 'abbreviation'])),
            'assessment_types' => AssessmentType::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(StoreQuestionPaperRequest $request): RedirectResponse
    {
        Gate::authorize('managePapers', Question::class);

        $paper = QuestionPaper::query()->create($request->validated());

        return to_route('admin.question-papers.build', $paper)->with('success', 'Paper created. Start building!');
    }

    public function build(QuestionPaper $questionPaper): Response
    {
        Gate::authorize('managePapers', Question::class);

        $questionPaper->load([
            'institutionCourse:id,institution_id,course_code,course_title',
            'institutionCourse.institution:id,name,abbreviation',
            'assessmentType:id,name,slug',
            'sections' => fn ($q) => $q->orderBy('sort_order'),
            'sections.questions' => fn ($q) => $q->whereNull('parent_question_id')->orderBy('sort_order'),
            'sections.questions.answers',
            'sections.questions.children' => fn ($q) => $q->orderBy('sort_order'),
            'sections.questions.children.answers',
            'sections.questions.children.children' => fn ($q) => $q->orderBy('sort_order'),
            'sections.questions.children.children.answers',
            'sections.questions.children.children.children' => fn ($q) => $q->orderBy('sort_order'),
            'sections.questions.children.children.children.answers',
            'sections.questions.questionContextLinks',
            'contexts',
        ]);

        return Inertia::render('admin/question-papers/build', [
            'paper' => $questionPaper,
            'enum_options' => [
                'question_types' => array_map(fn ($c) => ['value' => $c->value, 'label' => $c->label()], QuestionType::cases()),
                'difficulties' => array_map(fn ($c) => ['value' => $c->value, 'label' => $c->label()], QuestionDifficulty::cases()),
                'bloom_levels' => array_map(fn ($c) => ['value' => $c->value, 'label' => $c->label()], BloomLevel::cases()),
                'context_types' => array_map(fn ($c) => ['value' => $c->value, 'label' => $c->label()], ContextType::cases()),
            ],
        ]);
    }

    public function update(UpdateQuestionPaperRequest $request, QuestionPaper $questionPaper): RedirectResponse
    {
        Gate::authorize('managePapers', Question::class);

        $questionPaper->update($request->validated());

        return back()->with('success', 'Paper updated.');
    }

    public function destroy(QuestionPaper $questionPaper): RedirectResponse
    {
        Gate::authorize('managePapers', Question::class);

        $questionPaper->delete();

        return to_route('admin.question-papers.index')->with('success', 'Paper deleted.');
    }
}
