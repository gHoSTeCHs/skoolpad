<?php

namespace App\Http\Controllers\Admin;

use App\Enums\QuestionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReorderQuestionsRequest;
use App\Http\Requests\Admin\StoreQuestionRequest;
use App\Http\Requests\Admin\UpdateQuestionRequest;
use App\Models\Question;
use App\Services\Admin\QuestionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class QuestionController extends Controller
{
    public function __construct(
        private readonly QuestionService $questionService,
    ) {}

    public function store(StoreQuestionRequest $request): RedirectResponse
    {
        Gate::authorize('create', Question::class);

        $data = $request->safe()->only([
            'institution_course_id', 'exam_subject_id', 'question_paper_id',
            'question_section_id', 'parent_question_id', 'question_type',
            'content', 'content_doc', 'year', 'semester', 'marks', 'difficulty_level',
            'bloom_level', 'source', 'status', 'response_config', 'choice_group',
        ]);

        $data['created_by'] = $request->user()->id;
        $data['sub_questions'] = $request->validated('sub_questions') ?? [];

        $question = $this->questionService->persistQuestionTree($data);

        if ($request->has('topic_ids')) {
            $this->questionService->syncTopicLinks(
                $question,
                $request->validated('topic_ids') ?? [],
                $request->validated('primary_topic_id'),
            );
        }

        if ($request->has('block_links')) {
            $this->questionService->syncBlockLinks($question, $request->validated('block_links') ?? []);
        }

        if ($request->boolean('from_paper_builder')) {
            return back()
                ->with('success', 'Question created.')
                ->with('created_question_id', $question->id);
        }

        return to_route('admin.questions.edit', $question)->with('success', 'Question created.');
    }

    public function update(UpdateQuestionRequest $request, Question $question): RedirectResponse
    {
        Gate::authorize('update', $question);

        if ($request->validated('status') === QuestionStatus::Published->value) {
            Gate::authorize('publish', $question);
        }

        $data = $request->safe()->only([
            'institution_course_id', 'exam_subject_id', 'question_paper_id',
            'question_section_id', 'parent_question_id', 'question_type',
            'content', 'content_doc', 'year', 'semester', 'marks', 'difficulty_level',
            'bloom_level', 'source', 'status', 'response_config', 'choice_group',
        ]);

        $data['sub_questions'] = $request->validated('sub_questions') ?? [];

        $this->questionService->updateQuestionTree($question, $data, $request->user());

        if ($request->has('topic_ids')) {
            $this->questionService->syncTopicLinks(
                $question,
                $request->validated('topic_ids') ?? [],
                $request->validated('primary_topic_id'),
            );
        }

        if ($request->has('block_links')) {
            $this->questionService->syncBlockLinks($question, $request->validated('block_links') ?? []);
        }

        return back()->with('success', 'Question updated.');
    }

    public function reorder(ReorderQuestionsRequest $request): JsonResponse
    {
        Gate::authorize('update', Question::class);

        $this->questionService->reorderQuestions($request->validated('questions'));

        return response()->json(['message' => 'Questions reordered.']);
    }

    /**
     * Legacy redirect: the standalone question index/create/edit/answers pages
     * were retired in favour of the unified composite builder. Old question
     * URLs are sent to the builder for the question's container.
     */
    public function legacyEditRedirect(Question $question): RedirectResponse
    {
        Gate::authorize('view', $question);

        if ($question->question_paper_id !== null) {
            return to_route('admin.question-papers.build', $question->question_paper_id);
        }

        if ($question->institution_course_id !== null) {
            return to_route('admin.question-library.course', $question->institution_course_id);
        }

        return to_route('admin.question-library.index');
    }
}
