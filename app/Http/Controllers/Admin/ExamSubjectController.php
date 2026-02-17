<?php

namespace App\Http\Controllers\Admin;

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
    public function index(Request $request): Response
    {
        $examSubjects = ExamSubject::query()
            ->with('examType:id,name')
            ->when($request->filled('search'), function ($query) use ($request) {
                $query->where('name', 'like', "%{$request->string('search')}%");
            })
            ->when($request->filled('exam_type_id'), function ($query) use ($request) {
                $query->where('exam_type_id', $request->string('exam_type_id'));
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/exam-subjects/index', [
            'examSubjects' => $examSubjects,
            'filters' => $request->only(['search', 'exam_type_id']),
            'examTypes' => ExamType::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/exam-subjects/create', [
            'examTypes' => ExamType::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function store(StoreExamSubjectRequest $request): RedirectResponse
    {
        ExamSubject::create($request->validated());

        return to_route('admin.exam-subjects.index')->with('success', 'Exam subject created successfully.');
    }

    public function edit(ExamSubject $examSubject): Response
    {
        $examSubject->load('examType:id,name');

        return Inertia::render('admin/exam-subjects/edit', [
            'examSubject' => $examSubject,
            'examTypes' => ExamType::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function update(UpdateExamSubjectRequest $request, ExamSubject $examSubject): RedirectResponse
    {
        $examSubject->update($request->validated());

        return to_route('admin.exam-subjects.index')->with('success', 'Exam subject updated successfully.');
    }
}
