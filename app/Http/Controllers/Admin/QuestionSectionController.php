<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreQuestionSectionRequest;
use App\Http\Requests\Admin\UpdateQuestionSectionRequest;
use App\Models\QuestionPaper;
use App\Models\QuestionSection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class QuestionSectionController extends Controller
{
    public function store(StoreQuestionSectionRequest $request, QuestionPaper $questionPaper): RedirectResponse
    {
        $data = $request->validated();
        $data['question_paper_id'] = $questionPaper->id;
        $data['sort_order'] = $questionPaper->sections()->count() + 1;

        QuestionSection::create($data);

        return back()->with('success', 'Section added.');
    }

    public function update(UpdateQuestionSectionRequest $request, QuestionPaper $questionPaper, QuestionSection $questionSection): RedirectResponse
    {
        $questionSection->update($request->validated());

        return back()->with('success', 'Section updated.');
    }

    public function destroy(QuestionPaper $questionPaper, QuestionSection $questionSection): RedirectResponse
    {
        $questionSection->delete();

        return back()->with('success', 'Section deleted.');
    }

    public function reorder(Request $request, QuestionPaper $questionPaper): JsonResponse
    {
        $request->validate([
            'sections' => ['required', 'array'],
            'sections.*.id' => ['required', 'uuid', 'exists:question_sections,id'],
            'sections.*.sort_order' => ['required', 'integer', 'min:0'],
        ]);

        foreach ($request->input('sections') as $item) {
            QuestionSection::where('id', $item['id'])
                ->where('question_paper_id', $questionPaper->id)
                ->update(['sort_order' => $item['sort_order']]);
        }

        return response()->json(['message' => 'Sections reordered.']);
    }
}
