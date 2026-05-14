<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreQuestionAnswerRequest;
use App\Models\Question;
use App\Models\QuestionAnswer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class AnswerController extends Controller
{
    public function store(StoreQuestionAnswerRequest $request, Question $question): RedirectResponse
    {
        Gate::authorize('manageAnswers', Question::class);

        $data = $request->validated();
        $data['question_id'] = $question->id;
        $data['created_by'] = $request->user()->id;

        QuestionAnswer::query()->create($data);

        return back()->with('success', 'Answer saved.');
    }

    public function update(StoreQuestionAnswerRequest $request, Question $question, QuestionAnswer $answer): RedirectResponse
    {
        Gate::authorize('manageAnswers', Question::class);

        $answer->update($request->validated());

        return back()->with('success', 'Answer updated.');
    }
}
