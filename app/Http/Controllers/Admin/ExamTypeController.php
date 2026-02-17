<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\Paginates;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreExamTypeRequest;
use App\Http\Requests\Admin\UpdateExamTypeRequest;
use App\Models\Country;
use App\Models\ExamType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExamTypeController extends Controller
{
    use Paginates;

    public function index(Request $request): Response
    {
        $examTypes = ExamType::query()
            ->withCount('examSubjects')
            ->when($request->filled('search'), function ($query) use ($request) {
                $query->where('name', 'like', "%{$request->string('search')}%");
            })
            ->when($request->filled('is_active'), function ($query) use ($request) {
                $query->where('is_active', $request->boolean('is_active'));
            })
            ->tap(fn ($query) => $this->applySorting($query, $request, ['name', 'duration_minutes', 'questions_per_subject', 'is_active', 'exam_subjects_count']))
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/exam-types/index', [
            'examTypes' => $this->paginated($examTypes),
            'filters' => $request->only(['search', 'is_active', 'sort', 'direction']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/exam-types/create', [
            'countries' => Country::all(),
        ]);
    }

    public function store(StoreExamTypeRequest $request): RedirectResponse
    {
        ExamType::create($request->validated());

        return to_route('admin.exam-types.index')->with('success', 'Exam type created successfully.');
    }

    public function edit(ExamType $examType): Response
    {
        return Inertia::render('admin/exam-types/edit', [
            'examType' => $examType,
            'countries' => Country::all(),
        ]);
    }

    public function update(UpdateExamTypeRequest $request, ExamType $examType): RedirectResponse
    {
        $examType->update($request->validated());

        return to_route('admin.exam-types.index')->with('success', 'Exam type updated successfully.');
    }
}
