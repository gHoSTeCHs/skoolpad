<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\Paginates;
use App\Enums\BloomLevel;
use App\Enums\QuestionDifficulty;
use App\Enums\QuestionSource;
use App\Enums\QuestionStatus;
use App\Enums\QuestionType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReorderQuestionsRequest;
use App\Http\Requests\Admin\StoreQuestionRequest;
use App\Http\Requests\Admin\UpdateQuestionRequest;
use App\Models\Institution;
use App\Models\Question;
use App\Services\Admin\QuestionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class QuestionController extends Controller
{
    use Paginates;

    public function __construct(
        private readonly QuestionService $questionService,
    ) {}

    public function index(Request $request): Response
    {
        $questions = Question::query()
            ->with([
                'institutionCourse:id,institution_id,course_code',
                'institutionCourse.institution:id,abbreviation',
            ])
            ->withCount(['topicLinks', 'answers'])
            ->when($request->filled('institution_id'), fn ($q) => $q->forInstitution($request->string('institution_id')))
            ->when($request->filled('institution_course_id'), fn ($q) => $q->forCourse($request->string('institution_course_id')))
            ->when($request->filled('year'), fn ($q) => $q->byYear((int) $request->string('year')->value()))
            ->when($request->filled('semester'), fn ($q) => $q->bySemester($request->string('semester')))
            ->when($request->filled('question_type'), fn ($q) => $q->byType($request->string('question_type')))
            ->when($request->filled('status'), fn ($q) => $q->byStatus($request->string('status')))
            ->when($request->filled('difficulty_level'), fn ($q) => $q->byDifficulty($request->string('difficulty_level')))
            ->when($request->filled('source'), fn ($q) => $q->bySource($request->string('source')))
            ->when($request->filled('search'), fn ($q) => $q->search($request->string('search')))
            ->tap(fn ($q) => $this->applySorting($q, $request, ['year', 'question_type', 'status', 'created_at'], 'created_at', 'desc'))
            ->paginate(self::DEFAULT_PER_PAGE)
            ->withQueryString();

        $questions->through(fn ($question) => [
            'id' => $question->id,
            'content' => str($question->content)->limit(100)->value(),
            'question_type' => $question->question_type,
            'year' => $question->year,
            'semester' => $question->semester,
            'status' => $question->status,
            'difficulty_level' => $question->difficulty_level,
            'source' => $question->source,
            'course_code' => $question->institutionCourse?->course_code,
            'institution_abbreviation' => $question->institutionCourse?->institution?->abbreviation,
            'topic_links_count' => $question->topic_links_count,
            'answers_count' => $question->answers_count,
            'created_at' => $question->created_at,
        ]);

        return Inertia::render('admin/questions/index', [
            'questions' => $this->paginated($questions),
            'institutions' => Institution::query()->where('is_active', true)->orderBy('abbreviation')->get(['id', 'name', 'abbreviation']),
            'filters' => $request->only([
                'search', 'institution_id', 'institution_course_id',
                'year', 'semester', 'question_type', 'status',
                'difficulty_level', 'source', 'sort', 'direction',
            ]),
            'enum_options' => [
                'question_types' => array_map(fn ($c) => ['value' => $c->value, 'label' => $c->label()], QuestionType::cases()),
                'statuses' => array_map(fn ($c) => ['value' => $c->value, 'label' => $c->label()], QuestionStatus::cases()),
                'difficulties' => array_map(fn ($c) => ['value' => $c->value, 'label' => $c->label()], QuestionDifficulty::cases()),
                'sources' => array_map(fn ($c) => ['value' => $c->value, 'label' => $c->label()], QuestionSource::cases()),
                'semesters' => [
                    ['value' => 'first', 'label' => 'First'],
                    ['value' => 'second', 'label' => 'Second'],
                ],
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/questions/create', [
            'institutions' => Institution::query()->where('is_active', true)->orderBy('abbreviation')->get(['id', 'name', 'abbreviation']),
            'enum_options' => [
                'question_types' => array_map(fn ($c) => ['value' => $c->value, 'label' => $c->label()], QuestionType::cases()),
                'difficulties' => array_map(fn ($c) => ['value' => $c->value, 'label' => $c->label()], QuestionDifficulty::cases()),
                'bloom_levels' => array_map(fn ($c) => ['value' => $c->value, 'label' => $c->label()], BloomLevel::cases()),
                'sources' => array_map(fn ($c) => ['value' => $c->value, 'label' => $c->label()], QuestionSource::cases()),
                'semesters' => [
                    ['value' => 'first', 'label' => 'First'],
                    ['value' => 'second', 'label' => 'Second'],
                ],
            ],
        ]);
    }

    public function store(StoreQuestionRequest $request): RedirectResponse
    {
        $data = $request->safe()->only([
            'institution_course_id', 'exam_subject_id', 'question_paper_id',
            'question_section_id', 'parent_question_id', 'question_type',
            'content', 'year', 'semester', 'marks', 'difficulty_level',
            'bloom_level', 'source', 'status', 'response_config',
        ]);

        $data['created_by'] = $request->user()->id;
        $data = $this->questionService->prepareQuestionData($data);

        $question = Question::query()->create($data);

        $topicIds = $request->validated('topic_ids');
        $primaryTopicId = $request->validated('primary_topic_id');
        if (! empty($topicIds)) {
            $this->questionService->syncTopicLinks($question, $topicIds, $primaryTopicId);
        }

        if ($request->has('block_links')) {
            $this->questionService->syncBlockLinks($question, $request->validated('block_links') ?? []);
        }

        return to_route('admin.questions.edit', $question)->with('success', 'Question created.');
    }

    public function edit(Question $question): Response
    {
        $question->load([
            'institutionCourse:id,institution_id,course_code',
            'institutionCourse.institution:id,name,abbreviation',
            'topicLinks.canonicalTopic:id,title',
            'questionBlockLinks.contentBlock:id,title,canonical_topic_id',
        ]);

        return Inertia::render('admin/questions/edit', [
            'question' => [
                'id' => $question->id,
                'institution_course_id' => $question->institution_course_id,
                'institution_id' => $question->institutionCourse?->institution_id,
                'question_type' => $question->question_type,
                'content' => $question->content,
                'year' => $question->year,
                'semester' => $question->semester,
                'marks' => $question->marks,
                'difficulty_level' => $question->difficulty_level,
                'bloom_level' => $question->bloom_level,
                'source' => $question->source,
                'status' => $question->status,
                'response_config' => $question->response_config,
                'topic_links' => $question->topicLinks->map(fn ($link) => [
                    'id' => $link->canonical_topic_id,
                    'title' => $link->canonicalTopic->title,
                    'is_primary' => $link->is_primary,
                ])->values(),
                'block_links' => $question->questionBlockLinks->map(fn ($link) => [
                    'content_block_id' => $link->content_block_id,
                    'title' => $link->contentBlock->title,
                    'relevance' => $link->relevance,
                ])->values(),
            ],
            'institutions' => Institution::query()->where('is_active', true)->orderBy('abbreviation')->get(['id', 'name', 'abbreviation']),
            'enum_options' => [
                'question_types' => array_map(fn ($c) => ['value' => $c->value, 'label' => $c->label()], QuestionType::cases()),
                'statuses' => array_map(fn ($c) => ['value' => $c->value, 'label' => $c->label()], QuestionStatus::cases()),
                'difficulties' => array_map(fn ($c) => ['value' => $c->value, 'label' => $c->label()], QuestionDifficulty::cases()),
                'bloom_levels' => array_map(fn ($c) => ['value' => $c->value, 'label' => $c->label()], BloomLevel::cases()),
                'sources' => array_map(fn ($c) => ['value' => $c->value, 'label' => $c->label()], QuestionSource::cases()),
                'semesters' => [
                    ['value' => 'first', 'label' => 'First'],
                    ['value' => 'second', 'label' => 'Second'],
                ],
            ],
        ]);
    }

    public function update(UpdateQuestionRequest $request, Question $question): RedirectResponse
    {
        $data = $request->safe()->only([
            'institution_course_id', 'exam_subject_id', 'question_paper_id',
            'question_section_id', 'parent_question_id', 'question_type',
            'content', 'year', 'semester', 'marks', 'difficulty_level',
            'bloom_level', 'source', 'status', 'response_config',
        ]);

        $data = $this->questionService->markPublishedIfNeeded($question, $data, $request->user());
        $question->update($data);

        $topicIds = $request->validated('topic_ids');
        $primaryTopicId = $request->validated('primary_topic_id');
        if (! empty($topicIds)) {
            $this->questionService->syncTopicLinks($question, $topicIds, $primaryTopicId);
        }

        if ($request->has('block_links')) {
            $this->questionService->syncBlockLinks($question, $request->validated('block_links') ?? []);
        }

        return to_route('admin.questions.edit', $question)->with('success', 'Question updated.');
    }

    public function reorder(ReorderQuestionsRequest $request): JsonResponse
    {
        $this->questionService->reorderQuestions($request->validated('questions'));

        return response()->json(['message' => 'Questions reordered.']);
    }
}
