<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\CanonicalTopic;
use App\Models\LevelSubject;
use App\Models\StudentProfile;
use App\Models\User;
use App\Services\ParentEngagementService;
use App\Services\SpacedRepetitionService;
use App\Services\Student\GuidedStudyService;
use App\Services\Student\StudentStatsService;
use App\Services\Student\StudyPlannerService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly ParentEngagementService $engagementService,
        private readonly StudentStatsService $statsService,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $profile = $user->studentProfile()
            ->with(['institution', 'faculty', 'department', 'educationSystem', 'educationLevel.curriculumTier', 'stream'])
            ->first();

        if ($profile && $profile->isTertiary()) {
            return $this->renderTertiary($user, $profile);
        }

        return $this->renderSecondary($user, $profile);
    }

    private function renderTertiary(User $user, StudentProfile $profile): Response
    {
        $courses = $profile->studentCourses()
            ->with(['institutionCourse' => fn ($q) => $q->withCount(['topics', 'questions'])])
            ->where('is_archived', false)
            ->get()
            ->map(fn ($sc) => [
                'id' => $sc->institutionCourse->id,
                'course_code' => $sc->institutionCourse->course_code,
                'course_title' => $sc->institutionCourse->course_title,
                'topic_count' => $sc->institutionCourse->topics_count,
                'question_count' => $sc->institutionCourse->questions_count,
            ]);

        $courseIds = $profile->studentCourses()->where('is_archived', false)->pluck('institution_course_id');

        $suggestedTopics = $courseIds->isNotEmpty()
            ? CanonicalTopic::query()
                ->where('is_published', true)
                ->whereHas('courseMappings', fn ($q) => $q->whereIn('institution_course_id', $courseIds))
                ->orderBy('title')
                ->limit(6)
                ->get(['id', 'title', 'slug'])
            : collect();

        $reviewQueueCount = app(SpacedRepetitionService::class)->getDueCount($user);

        $examTimetableCard = null;
        if ($user->examTimetableEntries()->active()->exists()) {
            $examTimetableCard = app(StudyPlannerService::class)->getExamSummary($user, $profile);
        }

        return Inertia::render('dashboard', [
            'student' => [
                'name' => $user->name,
                'student_type' => 'tertiary',
                'institution' => $profile->institution->name ?? null,
                'faculty' => $profile->faculty->name ?? null,
                'department' => $profile->department->name ?? null,
                'level' => $profile->level,
            ],
            'courses' => $courses,
            'subjects' => [],
            'stats' => [
                'courses_count' => $courses->count(),
                'practice_sessions' => $this->statsService->getPracticeCount($user),
                'study_hours' => $this->statsService->getStudyHours($user),
                'streak_days' => $this->statsService->getStreakDays($user),
                'questions_practiced' => $this->statsService->getQuestionsPracticed($user),
                'overall_accuracy' => $this->statsService->getOverallAccuracy($user),
            ],
            'suggested_topics' => $suggestedTopics,
            'guided_study' => null,
            'parent_invitation' => null,
            'level_progression' => null,
            'review_queue_count' => $reviewQueueCount,
            'continue_studying' => $this->statsService->getContinueStudying($user),
            'exam_timetable_card' => $examTimetableCard,
        ]);
    }

    private function renderSecondary(User $user, ?StudentProfile $profile): Response
    {
        $subjects = [];

        if ($profile) {
            $subjects = LevelSubject::query()
                ->where('education_level_id', $profile->education_level_id)
                ->when($profile->stream_id, fn ($q) => $q->where(function ($query) use ($profile) {
                    $query->whereNull('stream_id')
                        ->orWhere('stream_id', $profile->stream_id);
                }))
                ->with('curriculumSubject:id,name')
                ->get()
                ->map(fn ($ls) => [
                    'id' => $ls->id,
                    'name' => $ls->curriculumSubject->name,
                    'is_compulsory' => $ls->is_compulsory,
                ])
                ->values();
        }

        $isDismissedToday = ($profile?->study_preferences['plan_dismissed_date'] ?? null) === now()->toDateString();

        $guidedStudy = ($profile && ! $isDismissedToday)
            ? app(GuidedStudyService::class)->buildStudyPlan($user, $profile)
            : null;

        $reviewQueueCount = app(SpacedRepetitionService::class)->getDueCount($user);

        $examTimetableCard = null;
        if ($profile && $user->examTimetableEntries()->active()->exists()) {
            $examTimetableCard = app(StudyPlannerService::class)->getExamSummary($user, $profile);
        }

        return Inertia::render('dashboard', [
            'student' => $profile ? [
                'name' => $user->name,
                'student_type' => 'secondary',
                'education_system' => $profile->educationSystem->name ?? null,
                'education_level' => $profile->educationLevel->display_name ?? $profile->educationLevel->name ?? null,
                'tier' => $profile->educationLevel?->curriculumTier?->name ?? null,
                'stream' => $profile->stream->name ?? null,
                'exam_goals' => $profile->exam_goals ?? [],
            ] : null,
            'courses' => [],
            'subjects' => $subjects,
            'stats' => [
                'courses_count' => 0,
                'practice_sessions' => $this->statsService->getPracticeCount($user),
                'study_hours' => $this->statsService->getStudyHours($user),
                'streak_days' => $this->statsService->getStreakDays($user),
                'questions_practiced' => $this->statsService->getQuestionsPracticed($user),
                'overall_accuracy' => $this->statsService->getOverallAccuracy($user),
            ],
            'suggested_topics' => [],
            'guided_study' => $guidedStudy,
            'study_plan_dismissed' => $profile ? $isDismissedToday : false,
            'parent_invitation' => $profile ? $this->engagementService->shouldShowInvitePrompt($user, $profile) : null,
            'level_progression' => $profile ? $this->statsService->getLevelProgression($profile) : null,
            'review_queue_count' => $reviewQueueCount,
            'continue_studying' => $this->statsService->getContinueStudying($user),
            'exam_timetable_card' => $examTimetableCard,
        ]);
    }
}
