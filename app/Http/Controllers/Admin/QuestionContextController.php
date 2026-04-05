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

class QuestionContextController extends Controller
{
    public function store(StoreQuestionContextRequest $request, QuestionPaper $questionPaper): RedirectResponse
    {
        $data = $request->validated();
        $data['question_paper_id'] = $questionPaper->id;

        QuestionContext::query()->create($data);

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

    public function link(\App\Http\Requests\Admin\LinkQuestionContextRequest $request, Question $question): JsonResponse
    {
        $validated = $request->validated();

        $question->contexts()->syncWithoutDetaching([
            $validated['context_id'] => [
                'sort_order' => $validated['sort_order'] ?? 0,
                'label' => $validated['label'] ?? null,
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
