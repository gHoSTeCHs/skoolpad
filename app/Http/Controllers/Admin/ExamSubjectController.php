<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\Paginates;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreExamSubjectRequest;
use App\Http\Requests\Admin\UpdateExamSubjectRequest;
use App\Models\ExamSubject;
use App\Models\ExamType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExamSubjectController extends Controller
{
    use Paginates;

    public function index(Request $request, ExamType $examType): Response
    {
        $examSubjects = ExamSubject::query()
            ->where('exam_type_id', $examType->id)
            ->when($request->filled('search'), function ($query) use ($request) {
                $query->where('name', 'ilike', "%{$request->string('search')}%");
            })
            ->tap(fn ($query) => $this->applySorting($query, $request, ['name', 'is_compulsory']))
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/exam-subjects/index', [
            'examSubjects' => $this->paginated($examSubjects),
            'filters' => $request->only(['search', 'sort', 'direction']),
            'examType' => $examType->only('id', 'name', 'slug'),
        ]);
    }

    public function create(ExamType $examType): Response
    {
        return Inertia::render('admin/exam-subjects/create', [
            'examType' => $examType->only('id', 'name', 'slug'),
        ]);
    }

    public function store(StoreExamSubjectRequest $request, ExamType $examType): RedirectResponse
    {
        $examType->examSubjects()->create($request->validated());

        return to_route('admin.exam-subjects.index', $examType)->with('success', 'Exam subject created successfully.');
    }

    public function edit(ExamSubject $examSubject): Response
    {
        $examSubject->load('examType:id,name');

        return Inertia::render('admin/exam-subjects/edit', [
            'examSubject' => $examSubject,
        ]);
    }

    public function update(UpdateExamSubjectRequest $request, ExamSubject $examSubject): RedirectResponse
    {
        $examSubject->update($request->validated());

        return to_route('admin.exam-subjects.index', $examSubject->exam_type_id)->with('success', 'Exam subject updated successfully.');
    }
}
