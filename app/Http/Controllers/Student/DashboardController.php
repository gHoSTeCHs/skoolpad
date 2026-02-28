<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\CanonicalTopic;
use App\Models\LevelSubject;
use App\Models\StudentProfile;
use App\Services\GuidedStudyService;
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
                'practice_sessions' => 0,
                'study_hours' => 0,
                'streak_days' => 0,
            ],
            'suggested_topics' => $suggestedTopics,
            'guided_study' => null,
            'parent_invitation' => $this->getParentInvitation($profile),
            'level_progression' => null,
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
                'practice_sessions' => 0,
                'study_hours' => 0,
                'streak_days' => 0,
            ],
            'suggested_topics' => [],
            'guided_study' => $guidedStudy,
            'study_plan_dismissed' => $profile ? $isDismissedToday : false,
            'parent_invitation' => $profile ? $this->getParentInvitation($profile) : null,
            'level_progression' => $profile ? $this->getLevelProgression($profile) : null,
        ]);
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
