<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\StartMockExamRequest;
use App\Models\QuestionPaper;
use App\Services\ExamPrepService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExamPrepController extends Controller
{
    public function __construct(private ExamPrepService $examPrepService) {}

    public function index(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        $goals = $this->examPrepService->getActiveGoals($user);

        if ($goals->isEmpty()) {
            return redirect()->route('practice.configure')
                ->with('info', 'Set up your exam goals to unlock Exam Prep.');
        }

        $papers = [];
        foreach ($goals as $goal) {
            $goalPapers = $this->examPrepService->getAvailablePapers(
                $goal->assessmentType,
                $goal->institutionCourse
            );
            $papers[$goal->id] = $goalPapers->map(fn ($p) => [
                'id' => $p->id,
                'title' => $p->title,
                'year' => $p->year,
                'duration_minutes' => $p->duration_minutes,
                'total_marks' => $p->total_marks,
                'question_count' => $p->questions_count,
            ]);
        }

        return Inertia::render('practice/exam-prep', [
            'goals' => $goals->map(fn ($g) => [
                'id' => $g->id,
                'assessment_type' => [
                    'id' => $g->assessmentType->id,
                    'name' => $g->assessmentType->name,
                    'is_exit_exam' => $g->assessmentType->is_exit_exam,
                    'is_entrance_exam' => $g->assessmentType->is_entrance_exam,
                ],
                'institution_course' => $g->institutionCourse ? [
                    'id' => $g->institutionCourse->id,
                    'course_code' => $g->institutionCourse->course_code,
                    'course_title' => $g->institutionCourse->course_title,
                ] : null,
                'exam_date' => $g->exam_date?->toDateString(),
                'target_score' => $g->target_score,
                'days_remaining' => $g->exam_date ? max(0, now()->startOfDay()->diffInDays($g->exam_date, false)) : null,
            ]),
            'papers' => $papers,
        ]);
    }

    public function start(StartMockExamRequest $request): RedirectResponse
    {
        $user = $request->user();
        $paper = QuestionPaper::findOrFail($request->validated('question_paper_id'));

        if (! $paper->is_published) {
            abort(403, 'This paper is not available.');
        }

        $userAssessmentTypeIds = $user->examGoals()
            ->where('is_active', true)
            ->pluck('assessment_type_id');

        if ($paper->assessment_type_id && ! $userAssessmentTypeIds->contains($paper->assessment_type_id)) {
            abort(403, 'This paper does not match your exam goals.');
        }

        $session = $this->examPrepService->createMockSession($user, $paper);

        return redirect()->route('practice.show', $session);
    }

    public function dailyPlan(Request $request): JsonResponse
    {
        $user = $request->user();
        $goals = $this->examPrepService->getActiveGoals($user);
        $primaryGoal = $goals->first();

        if (! $primaryGoal) {
            return response()->json(['plan' => null]);
        }

        $plan = $this->examPrepService->getDailyPlan($user, $primaryGoal);

        return response()->json(['plan' => $plan]);
    }
}
