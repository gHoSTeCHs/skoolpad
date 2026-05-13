<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Question;
use App\Services\Admin\QuestionLibraryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class QuestionLibraryController extends Controller
{
    public function __construct(
        private readonly QuestionLibraryService $libraryService,
    ) {}

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Question::class);

        $filters = [
            'search' => $request->string('search')->toString() ?: null,
            'status' => $request->string('status')->toString() ?: null,
        ];

        return Inertia::render('admin/preview/question-library/index', [
            'counts' => $this->libraryService->getCounts(),
            'papers' => $this->libraryService->getPapersWithStats($filters),
            'course_pools' => $this->libraryService->getCoursePools($filters),
            'exam_subject_pools' => $this->libraryService->getExamSubjectPools(),
            'unattached_questions' => $this->libraryService->getUnattachedQuestions(),
            'filters' => array_filter($filters, fn ($v) => $v !== null),
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Question::class);

        $term = $request->string('q')->toString();

        return response()->json([
            'results' => $this->libraryService->globalSearch($term),
        ]);
    }
}
