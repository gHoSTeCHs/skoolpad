<?php

namespace App\Services;

use App\Enums\QuestionStatus;
use App\Enums\UserRole;
use App\Models\CanonicalTopic;
use App\Models\InstitutionCourse;
use App\Models\Question;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    /** @return array<string, mixed> */
    public function getUserMetrics(): array
    {
        $now = Carbon::now();

        return [
            'total_users' => User::count(),
            'total_students' => User::where('role', UserRole::Student)->count(),
            'total_staff' => User::where('role', '!=', UserRole::Student)->count(),
            'new_today' => User::whereDate('created_at', $now->toDateString())->count(),
            'new_this_week' => User::where('created_at', '>=', $now->startOfWeek())->count(),
            'new_this_month' => User::where('created_at', '>=', $now->startOfMonth())->count(),
            'registrations_trend' => $this->getRegistrationsTrend(14),
            'users_by_institution' => $this->getUsersByInstitution(5),
        ];
    }

    /** @return array<string, mixed> */
    public function getContentMetrics(): array
    {
        return [
            'total_questions' => Question::count(),
            'published_questions' => Question::where('status', QuestionStatus::Published)->count(),
            'draft_questions' => Question::where('status', QuestionStatus::Draft)->count(),
            'in_review_questions' => Question::where('status', QuestionStatus::InReview)->count(),
            'total_topics' => CanonicalTopic::count(),
            'published_topics' => CanonicalTopic::where('is_published', true)->count(),
            'total_courses' => InstitutionCourse::count(),
            'courses_with_questions' => InstitutionCourse::whereHas('questions')->count(),
            'questions_by_institution' => $this->getQuestionsByInstitution(5),
        ];
    }

    /** @return array<string, int> */
    public function getActiveUserMetrics(): array
    {
        $now = Carbon::now();

        return [
            'dau' => User::where('last_login_at', '>=', $now->copy()->startOfDay())->count(),
            'wau' => User::where('last_login_at', '>=', $now->copy()->subDays(7))->count(),
            'mau' => User::where('last_login_at', '>=', $now->copy()->subDays(30))->count(),
        ];
    }

    /** @return array<string, mixed> */
    public function getPracticeMetrics(): array
    {
        return [
            'total_sessions' => 0,
            'avg_score' => null,
            'most_practiced_courses' => [],
        ];
    }

    /** @return list<array{date: string, count: int}> */
    private function getRegistrationsTrend(int $days): array
    {
        $start = Carbon::now()->subDays($days - 1)->startOfDay();
        $end = Carbon::now()->endOfDay();

        $registrations = User::query()
            ->where('created_at', '>=', $start)
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as count'))
            ->groupBy('date')
            ->pluck('count', 'date')
            ->all();

        $trend = [];
        foreach (CarbonPeriod::create($start, $end) as $date) {
            $key = $date->toDateString();
            $trend[] = [
                'date' => $date->format('M j'),
                'count' => (int) ($registrations[$key] ?? 0),
            ];
        }

        return $trend;
    }

    /** @return list<array{name: string, abbreviation: string, count: int}> */
    private function getUsersByInstitution(int $limit): array
    {
        return DB::table('student_profiles')
            ->join('institutions', 'student_profiles.institution_id', '=', 'institutions.id')
            ->select('institutions.name', 'institutions.abbreviation', DB::raw('COUNT(*) as count'))
            ->groupBy('institutions.id', 'institutions.name', 'institutions.abbreviation')
            ->orderByDesc('count')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => [
                'name' => $row->name,
                'abbreviation' => $row->abbreviation,
                'count' => (int) $row->count,
            ])
            ->all();
    }

    /** @return list<array{name: string, abbreviation: string, count: int}> */
    private function getQuestionsByInstitution(int $limit): array
    {
        return DB::table('questions')
            ->join('institution_courses', 'questions.institution_course_id', '=', 'institution_courses.id')
            ->join('institutions', 'institution_courses.institution_id', '=', 'institutions.id')
            ->whereNotNull('questions.institution_course_id')
            ->select('institutions.name', 'institutions.abbreviation', DB::raw('COUNT(*) as count'))
            ->groupBy('institutions.id', 'institutions.name', 'institutions.abbreviation')
            ->orderByDesc('count')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => [
                'name' => $row->name,
                'abbreviation' => $row->abbreviation,
                'count' => (int) $row->count,
            ])
            ->all();
    }
}
