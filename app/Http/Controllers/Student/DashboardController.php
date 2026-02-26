<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\CanonicalTopic;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $profile = $user->studentProfile()->with(['institution', 'faculty', 'department'])->first();

        $courses = $profile
            ? $profile->studentCourses()
                ->with(['institutionCourse' => fn ($q) => $q->withCount(['topics', 'questions'])])
                ->where('is_archived', false)
                ->get()
                ->map(fn ($sc) => [
                    'id' => $sc->institutionCourse->id,
                    'course_code' => $sc->institutionCourse->course_code,
                    'course_title' => $sc->institutionCourse->course_title,
                    'topic_count' => $sc->institutionCourse->topics_count,
                    'question_count' => $sc->institutionCourse->questions_count,
                ])
            : [];

        $courseIds = $profile
            ? $profile->studentCourses()->where('is_archived', false)->pluck('institution_course_id')
            : collect();

        $suggestedTopics = $courseIds->isNotEmpty()
            ? CanonicalTopic::query()
                ->where('is_published', true)
                ->whereHas('courseMappings', fn ($q) => $q->whereIn('institution_course_id', $courseIds))
                ->orderBy('title')
                ->limit(6)
                ->get(['id', 'title', 'slug'])
            : collect();

        return Inertia::render('dashboard', [
            'student' => $profile ? [
                'name' => $user->name,
                'institution' => $profile->institution->name,
                'faculty' => $profile->faculty->name,
                'department' => $profile->department->name,
                'level' => $profile->level,
            ] : null,
            'courses' => $courses,
            'stats' => [
                'courses_count' => is_countable($courses) ? count($courses) : $courses->count(),
                'practice_sessions' => 0,
                'study_hours' => 0,
                'streak_days' => 0,
            ],
            'suggested_topics' => $suggestedTopics,
        ]);
    }
}
