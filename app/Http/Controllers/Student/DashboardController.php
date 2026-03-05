<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\BlockCompletion;
use App\Models\CanonicalTopic;
use App\Models\LevelSubject;
use App\Models\PracticeAnswer;
use App\Models\PracticeSession;
use App\Models\StudentProfile;
use App\Services\GuidedStudyService;
use App\Services\SpacedRepetitionService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
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

    private function renderTertiary(mixed $user, StudentProfile $profile): Response
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

        $practiceCount = PracticeSession::where('user_id', $user->id)->whereNotNull('completed_at')->count();
        $studyHours = round((float) PracticeSession::where('user_id', $user->id)->whereNotNull('completed_at')->sum('total_time_seconds') / 3600, 1);
        $reviewQueueCount = app(SpacedRepetitionService::class)->getDueCount($user);
        $continueStudying = $this->getContinueStudying($user);

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
                'practice_sessions' => $practiceCount,
                'study_hours' => $studyHours,
                'streak_days' => 0,
                'questions_practiced' => PracticeAnswer::whereHas('practiceSession', fn ($q) => $q->where('user_id', $user->id))->count(),
                'overall_accuracy' => $this->calculateOverallAccuracy($user),
            ],
            'suggested_topics' => $suggestedTopics,
            'guided_study' => null,
            'parent_invitation' => $this->getParentInvitation($profile),
            'level_progression' => null,
            'review_queue_count' => $reviewQueueCount,
            'continue_studying' => $continueStudying,
        ]);
    }

    private function renderSecondary(mixed $user, ?StudentProfile $profile): Response
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

        $practiceCount = PracticeSession::where('user_id', $user->id)->whereNotNull('completed_at')->count();
        $studyHours = round((float) PracticeSession::where('user_id', $user->id)->whereNotNull('completed_at')->sum('total_time_seconds') / 3600, 1);
        $reviewQueueCount = app(SpacedRepetitionService::class)->getDueCount($user);
        $continueStudying = $this->getContinueStudying($user);

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
                'practice_sessions' => $practiceCount,
                'study_hours' => $studyHours,
                'streak_days' => 0,
                'questions_practiced' => PracticeAnswer::whereHas('practiceSession', fn ($q) => $q->where('user_id', $user->id))->count(),
                'overall_accuracy' => $this->calculateOverallAccuracy($user),
            ],
            'suggested_topics' => [],
            'guided_study' => $guidedStudy,
            'study_plan_dismissed' => $profile ? $isDismissedToday : false,
            'parent_invitation' => $profile ? $this->getParentInvitation($profile) : null,
            'level_progression' => $profile ? $this->getLevelProgression($profile) : null,
            'review_queue_count' => $reviewQueueCount,
            'continue_studying' => $continueStudying,
        ]);
    }

    private function calculateOverallAccuracy(mixed $user): int
    {
        $total = PracticeAnswer::query()
            ->whereHas('practiceSession', fn ($q) => $q->where('user_id', $user->id))
            ->whereNotNull('is_correct')
            ->count();

        if ($total === 0) {
            return 0;
        }

        $correct = PracticeAnswer::query()
            ->whereHas('practiceSession', fn ($q) => $q->where('user_id', $user->id))
            ->where('is_correct', true)
            ->count();

        return (int) round($correct / $total * 100);
    }

    /** @return array{type: string, label: string, url: string}|null */
    private function getContinueStudying(mixed $user): ?array
    {
        $lastSession = PracticeSession::where('user_id', $user->id)
            ->where('is_resumable', true)
            ->whereNull('completed_at')
            ->latest('last_activity_at')
            ->with('institutionCourse:id,course_code')
            ->first();

        $lastBlock = BlockCompletion::where('user_id', $user->id)
            ->latest('completed_at')
            ->with('contentBlock.canonicalTopic:id,title,slug')
            ->first();

        $sessionTime = $lastSession?->last_activity_at;
        $blockTime = $lastBlock?->completed_at;

        if (! $sessionTime && ! $blockTime) {
            return null;
        }

        if ($sessionTime && (! $blockTime || $sessionTime->gt($blockTime))) {
            $answered = $lastSession->practiceAnswers()->count();
            $courseCode = $lastSession->institutionCourse?->course_code ?? 'Unknown';

            return [
                'type' => 'practice',
                'label' => "{$answered}/{$lastSession->question_count} questions in {$courseCode}",
                'url' => route('practice.show', $lastSession),
            ];
        }

        $topic = $lastBlock->contentBlock?->canonicalTopic;
        if (! $topic) {
            return null;
        }

        return [
            'type' => 'topic',
            'label' => $topic->title,
            'url' => route('topics.show', $topic),
        ];
    }

    /**
     * @return array{show: bool, current_level: string, next_level: string, next_level_id: string}|null
     */
    private function getLevelProgression(StudentProfile $profile): ?array
    {
        if ($profile->isTertiary() || ! $profile->education_level_id) {
            return null;
        }

        $nextLevel = $profile->findNextLevel();
        if (! $nextLevel) {
            return null;
        }

        $month = (int) now()->format('n');
        $day = (int) now()->format('j');
        $isTransitionPeriod = ($month === 1 && $day <= 14)
            || ($month === 4 && $day <= 14)
            || ($month === 9 && $day <= 14);

        if (! $isTransitionPeriod) {
            return null;
        }

        $currentLevel = $profile->educationLevel;

        return [
            'show' => true,
            'current_level' => $currentLevel->display_name ?? $currentLevel->name,
            'next_level' => $nextLevel->display_name ?? $nextLevel->name,
            'next_level_id' => $nextLevel->id,
        ];
    }

    /**
     * @return array{show: bool, style: string, is_early_level: bool}|null
     */
    private function getParentInvitation(StudentProfile $profile): ?array
    {
        if (! $profile->isSecondary()) {
            return null;
        }

        $level = $profile->educationLevel;
        if (! $level) {
            return null;
        }

        $tier = $level->curriculumTier;
        if (! $tier) {
            return null;
        }

        $sortOrder = $level->sort_order;
        $isEarlyLevel = $sortOrder <= 2;

        if ($profile->parent_invite_dismissed_at) {
            if (! $isEarlyLevel) {
                return null;
            }

            if ($profile->parent_invite_dismissed_at->diffInDays(now()) < 7) {
                return null;
            }
        }

        return [
            'show' => true,
            'style' => $isEarlyLevel ? 'prominent' : 'subtle',
            'is_early_level' => $isEarlyLevel,
        ];
    }
}
