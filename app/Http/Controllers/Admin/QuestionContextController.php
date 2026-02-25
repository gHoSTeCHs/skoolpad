<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreQuestionContextRequest;
use App\Http\Requests\Admin\UpdateQuestionContextRequest;
use App\Models\Question;
use App\Models\QuestionContext;
use App\Models\QuestionPaper;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class QuestionContextController extends Controller
{
    public function store(StoreQuestionContextRequest $request, QuestionPaper $questionPaper): RedirectResponse
    {
        $data = $request->validated();
        $data['question_paper_id'] = $questionPaper->id;

        QuestionContext::create($data);

        return back()->with('success', 'Context added.');
    }

    public function update(UpdateQuestionContextRequest $request, QuestionPaper $questionPaper, QuestionContext $questionContext): RedirectResponse
    {
        $questionContext->update($request->validated());

        return back()->with('success', 'Context updated.');
    }

    public function destroy(QuestionPaper $questionPaper, QuestionContext $questionContext): RedirectResponse
    {
        $questionContext->delete();

        return back()->with('success', 'Context deleted.');
    }

    public function link(Request $request, Question $question): JsonResponse
    {
        $request->validate([
            'context_id' => ['required', 'uuid', 'exists:question_contexts,id'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'label' => ['nullable', 'string', 'max:100'],
        ]);

        $question->contexts()->syncWithoutDetaching([
            $request->input('context_id') => [
                'sort_order' => $request->input('sort_order', 0),
                'label' => $request->input('label'),
            ],
        ]);

        return response()->json(['message' => 'Context linked.']);
    }

    public function unlink(Question $question, QuestionContext $questionContext): JsonResponse
    {
        $question->contexts()->detach($questionContext->id);

        return response()->json(['message' => 'Context unlinked.']);
    }
}
