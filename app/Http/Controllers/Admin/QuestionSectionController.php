<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReorderQuestionSectionsRequest;
use App\Http\Requests\Admin\StoreQuestionSectionRequest;
use App\Http\Requests\Admin\UpdateQuestionSectionRequest;
use App\Models\Question;
use App\Models\QuestionPaper;
use App\Models\QuestionSection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class QuestionSectionController extends Controller
{
    public function store(StoreQuestionSectionRequest $request, QuestionPaper $questionPaper): RedirectResponse
    {
        Gate::authorize('managePapers', Question::class);

        $data = $request->validated();
        $data['question_paper_id'] = $questionPaper->id;
        $data['sort_order'] = $questionPaper->sections()->count() + 1;

        QuestionSection::query()->create($data);

        return back()->with('success', 'Section added.');
    }

    public function update(UpdateQuestionSectionRequest $request, QuestionPaper $questionPaper, QuestionSection $questionSection): RedirectResponse
    {
        Gate::authorize('managePapers', Question::class);

        $questionSection->update($request->validated());

        return back()->with('success', 'Section updated.');
    }

    public function destroy(QuestionPaper $questionPaper, QuestionSection $questionSection): RedirectResponse
    {
        Gate::authorize('managePapers', Question::class);

        $questionSection->delete();

        return back()->with('success', 'Section deleted.');
    }

    public function reorder(ReorderQuestionSectionsRequest $request, QuestionPaper $questionPaper): JsonResponse
    {
        Gate::authorize('managePapers', Question::class);

        foreach ($request->validated('sections') as $item) {
            QuestionSection::query()->where('id', $item['id'])
                ->where('question_paper_id', $questionPaper->id)
                ->update(['sort_order' => $item['sort_order']]);
        }

        return response()->json(['message' => 'Sections reordered.']);
    }
}
