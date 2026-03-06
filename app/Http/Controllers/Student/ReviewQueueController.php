<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\InstitutionCourse;
use App\Services\PracticeService;
use App\Services\SpacedRepetitionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReviewQueueController extends Controller
{
    public function __construct(
        private SpacedRepetitionService $spacedRepService,
        private PracticeService $practiceService,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $profile = $user->studentProfile;

        $enrolledCourses = $profile->studentCourses()
            ->where('is_archived', false)
            ->with(['institutionCourse:id,course_code,course_title'])
            ->get()
            ->map(fn ($sc) => [
                'id' => $sc->institutionCourse->id,
                'course_code' => $sc->institutionCourse->course_code,
                'course_title' => $sc->institutionCourse->course_title,
            ]);

        $selectedCourseId = $request->query('course');
        $course = $selectedCourseId
            ? InstitutionCourse::find($selectedCourseId)
            : null;

        $dueItems = $this->spacedRepService->getDueItems($user, $course);
        $dueCount = $this->spacedRepService->getDueCount($user);
        $calendar = $this->spacedRepService->getUpcomingCounts($user, 14);

        return Inertia::render('review-queue/index', [
            'dueCount' => $dueCount,
            'dueItems' => $dueItems->map(fn ($item) => [
                'id' => $item->id,
                'question_id' => $item->question_id,
                'strength' => $item->strength,
                'interval_days' => $item->interval_days,
                'next_review_at' => $item->next_review_at->toDateString(),
                'question_content' => $item->question?->content,
                'course_code' => $item->question?->institutionCourse?->course_code,
            ]),
            'enrolledCourses' => $enrolledCourses,
            'selectedCourseId' => $selectedCourseId,
            'calendar' => $calendar,
        ]);
    }

    public function start(Request $request): RedirectResponse
    {
        $user = $request->user();

        $selectedCourseId = $request->input('course_id');
        $course = $selectedCourseId
            ? InstitutionCourse::find($selectedCourseId)
            : null;

        if ($course) {
            $enrolledCourseIds = $user->studentProfile->studentCourses()
                ->where('is_archived', false)
                ->pluck('institution_course_id');

            if (! $enrolledCourseIds->contains($course->id)) {
                abort(403, 'You are not enrolled in this course.');
            }
        }

        $dueItems = $this->spacedRepService->getDueItems($user, $course);

        if ($dueItems->isEmpty()) {
            return redirect()->route('review-queue.index')
                ->with('flash', ['message' => 'No items due for review right now.']);
        }

        $questionIds = $dueItems->pluck('question_id')->values()->toArray();

        $session = $this->practiceService->createReviewSession(
            $user,
            $questionIds,
            $course?->id,
        );

        return redirect()->route('practice.show', $session);
    }

    public function calendar(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'calendar' => $this->spacedRepService->getUpcomingCounts($user, 14),
        ]);
    }
}
