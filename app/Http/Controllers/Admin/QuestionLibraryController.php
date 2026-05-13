<?php

namespace App\Http\Controllers\Admin;

use App\Enums\BloomLevel;
use App\Enums\QuestionDifficulty;
use App\Enums\QuestionType;
use App\Http\Controllers\Controller;
use App\Models\InstitutionCourse;
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

    public function showCourse(InstitutionCourse $course): Response
    {
        Gate::authorize('viewAny', Question::class);

        return Inertia::render('admin/preview/question-library/courses/show', [
            'pool' => $this->libraryService->getCoursePoolBuild($course),
            'enum_options' => [
                'question_types' => array_map(fn ($c) => ['value' => $c->value, 'label' => $c->label()], QuestionType::cases()),
                'difficulties' => array_map(fn ($c) => ['value' => $c->value, 'label' => $c->label()], QuestionDifficulty::cases()),
                'bloom_levels' => array_map(fn ($c) => ['value' => $c->value, 'label' => $c->label()], BloomLevel::cases()),
            ],
        ]);
    }
}
