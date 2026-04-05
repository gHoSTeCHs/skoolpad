<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\InstitutionCourse;
use App\Models\LevelSubject;
use App\Services\SpacedRepetitionService;
use App\Services\Student\PracticeService;
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
        $isSecondary = $profile?->isSecondary() ?? false;

        $enrolledCourses = [];
        $enrolledSubjects = [];

        if ($isSecondary) {
            $enrolledSubjects = LevelSubject::query()
                ->where('education_level_id', $profile->education_level_id)
                ->when($profile->stream_id, fn ($q) => $q->where(function ($q2) use ($profile) {
                    $q2->where('stream_id', $profile->stream_id)->orWhereNull('stream_id');
                }))
                ->with(['curriculumSubject:id,name'])
                ->get()
                ->map(fn ($ls) => [
                    'id' => $ls->id,
                    'subject_name' => $ls->curriculumSubject->name,
                ]);
        } else {
            $enrolledCourses = $profile->studentCourses()
                ->where('is_archived', false)
                ->with(['institutionCourse:id,course_code,course_title'])
                ->get()
                ->map(fn ($sc) => [
                    'id' => $sc->institutionCourse->id,
                    'course_code' => $sc->institutionCourse->course_code,
                    'course_title' => $sc->institutionCourse->course_title,
                ]);
        }

        $selectedCourseId = $request->query('course');
        $selectedSubjectId = $request->query('subject');

        $course = null;
        $levelSubject = null;

        if ($isSecondary && $selectedSubjectId) {
            $levelSubject = LevelSubject::query()->find($selectedSubjectId);
        } elseif ($selectedCourseId) {
            $course = InstitutionCourse::query()->find($selectedCourseId);
        }

        $dueItems = $this->spacedRepService->getDueItems($user, $course, null, $levelSubject);
        $dueCount = $this->spacedRepService->getDueCount($user, $course, $levelSubject);
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
            'enrolledSubjects' => $enrolledSubjects,
            'isSecondary' => $isSecondary,
            'selectedCourseId' => $selectedCourseId,
            'selectedSubjectId' => $selectedSubjectId,
            'calendar' => $calendar,
        ]);
    }

    public function start(Request $request): RedirectResponse
    {
        $user = $request->user();
        $profile = $user->studentProfile;

        $selectedCourseId = $request->input('course_id');
        $levelSubjectId = $request->input('level_subject_id');
        $course = $selectedCourseId
            ? InstitutionCourse::query()->find($selectedCourseId)
            : null;

        if ($course) {
            $enrolledCourseIds = $profile->studentCourses()
                ->where('is_archived', false)
                ->pluck('institution_course_id');

            if (! $enrolledCourseIds->contains($course->id)) {
                abort(403, 'You are not enrolled in this course.');
            }
        }

        $levelSubject = null;
        if ($levelSubjectId) {
            $levelSubject = LevelSubject::query()->findOrFail($levelSubjectId);
            if ($levelSubject->education_level_id !== $profile->education_level_id) {
                abort(403, 'This subject is not available for your education level.');
            }
        }

        $dueItems = $this->spacedRepService->getDueItems($user, $course, null, $levelSubject);

        if ($dueItems->isEmpty()) {
            return redirect()->route('review-queue.index')
                ->with('flash', ['message' => 'No items due for review right now.']);
        }

        $questionIds = $dueItems->pluck('question_id')->values()->toArray();

        $session = $this->practiceService->createReviewSession(
            $user,
            $questionIds,
            $course?->id,
            $levelSubjectId,
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
