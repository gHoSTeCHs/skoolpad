<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AnswerDepthLevel;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreQuestionAnswerRequest;
use App\Models\Question;
use App\Models\QuestionAnswer;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AnswerController extends Controller
{
    public function index(Question $question): Response
    {
        $question->load([
            'institutionCourse:id,course_code',
            'answers',
        ]);

        $answersMap = $question->answers->keyBy(fn ($a) => $a->depth_level->value);

        return Inertia::render('admin/questions/answers', [
            'question' => [
                'id' => $question->id,
                'content' => $question->content,
                'question_type' => $question->question_type,
                'course_code' => $question->institutionCourse?->course_code,
            ],
            'answers' => collect(AnswerDepthLevel::cases())->map(fn ($depth) => [
                'depth_level' => $depth->value,
                'label' => $depth->label(),
                'description' => $depth->description(),
                'answer' => $answersMap->has($depth->value) ? [
                    'id' => $answersMap[$depth->value]->id,
                    'content' => $answersMap[$depth->value]->content,
                    'content_plain' => $answersMap[$depth->value]->content_plain,
                    'is_published' => $answersMap[$depth->value]->is_published,
                ] : null,
            ])->values(),
        ]);
    }

    public function store(StoreQuestionAnswerRequest $request, Question $question): RedirectResponse
    {
        $data = $request->validated();
        $data['question_id'] = $question->id;
        $data['created_by'] = $request->user()->id;

        QuestionAnswer::query()->create($data);

        return back()->with('success', 'Answer saved.');
    }

    public function update(StoreQuestionAnswerRequest $request, Question $question, QuestionAnswer $answer): RedirectResponse
    {
        $answer->update($request->validated());

        return back()->with('success', 'Answer updated.');
    }
}
