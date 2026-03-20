<?php

namespace App\Services;

use App\Enums\ParentChildLinkStatus;
use App\Enums\TopicCoverageStatus;
use App\Enums\VerificationResult;
use App\Mail\WeeklyParentReport;
use App\Models\ExamCountdown;
use App\Models\ExamReadinessCache;
use App\Models\ParentChildLink;
use App\Models\ParentProfile;
use App\Models\PracticeSession;
use App\Models\StudentProfile;
use App\Models\VerificationAttempt;
use App\Notifications\ParentExamAlert;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Mail;

class ParentNotificationService
{
    public function sendWeeklyReport(ParentProfile $parentProfile, StudentProfile $studentProfile): void
    {
        $link = ParentChildLink::query()
            ->where('parent_profile_id', $parentProfile->id)
            ->where('student_profile_id', $studentProfile->id)
            ->where('status', ParentChildLinkStatus::Active)
            ->firstOrFail();

        $weekStart = now()->subWeek()->startOfWeek();
        $weekEnd = now()->subWeek()->endOfWeek();

        $reportData = $this->compileWeeklyReportData($link, $weekStart, $weekEnd);

        Mail::to($parentProfile->user->email)
            ->send(new WeeklyParentReport($reportData));
    }

    public function sendExamAlert(ParentChildLink $link, ExamCountdown $countdown): void
    {
        $alertData = $this->compileExamAlertData($link, $countdown);

        $link->parentProfile->user->notify(new ParentExamAlert($alertData));
    }

    /** @return array{child_name: string, study_time_minutes: int, subjects_practiced: array, questions_answered: int, accuracy: float, verifications: array{total: int, understood: int, needs_review: int}, readiness_scores: array} */
    public function compileWeeklyReportData(
        ParentChildLink $link,
        CarbonInterface $weekStart,
        CarbonInterface $weekEnd,
    ): array {
        $childUser = $link->studentProfile->user;

        $sessions = PracticeSession::query()
            ->where('user_id', $childUser->id)
            ->whereNotNull('completed_at')
            ->whereBetween('completed_at', [$weekStart, $weekEnd])
            ->with('levelSubject.curriculumSubject')
            ->get();

        $studyTimeMinutes = (int) round($sessions->sum('total_time_seconds') / 60);
        $questionsAnswered = $sessions->sum('question_count');
        $avgAccuracy = $sessions->avg('score_percentage') ?? 0;

        $subjectsPracticed = $sessions
            ->groupBy('level_subject_id')
            ->map(fn ($group) => $group->first()->levelSubject?->curriculumSubject?->name)
            ->filter()
            ->unique()
            ->values()
            ->all();

        $verifications = VerificationAttempt::query()
            ->where('parent_child_link_id', $link->id)
            ->whereBetween('created_at', [$weekStart, $weekEnd])
            ->get();

        $readinessScores = ExamReadinessCache::query()
            ->where('user_id', $childUser->id)
            ->with('levelSubject.curriculumSubject')
            ->get()
            ->map(fn (ExamReadinessCache $cache) => [
                'subject_name' => $cache->levelSubject?->curriculumSubject?->name,
                'composite_score' => (float) $cache->composite_score,
            ])
            ->all();

        return [
            'child_name' => $childUser->name,
            'study_time_minutes' => $studyTimeMinutes,
            'subjects_practiced' => $subjectsPracticed,
            'questions_answered' => $questionsAnswered,
            'accuracy' => round((float) $avgAccuracy, 2),
            'verifications' => [
                'total' => $verifications->count(),
                'understood' => $verifications->where('overall_result', VerificationResult::Understood)->count(),
                'needs_review' => $verifications->where('overall_result', VerificationResult::NeedsReview)->count(),
            ],
            'readiness_scores' => $readinessScores,
        ];
    }

    /** @return array{child_name: string, exam_name: string, exam_date: string, days_remaining: int, urgency: string, readiness_score: ?float, study_time_today_minutes: int, questions_today: int, accuracy_today: float, unverified_topic_count: int} */
    public function compileExamAlertData(ParentChildLink $link, ExamCountdown $countdown): array
    {
        $childUser = $link->studentProfile->user;
        $daysRemaining = max(0, (int) now()->diffInDays($countdown->exam_date, false));

        $urgency = match (true) {
            $daysRemaining === 0 => 'exam_day',
            $daysRemaining <= 3 => 'critical',
            $daysRemaining <= 7 => 'warning',
            default => 'informational',
        };

        $todaySessions = PracticeSession::query()
            ->where('user_id', $childUser->id)
            ->whereNotNull('completed_at')
            ->whereDate('completed_at', now()->toDateString())
            ->get();

        $readinessCache = ExamReadinessCache::query()
            ->where('user_id', $childUser->id)
            ->first();

        $unverifiedCount = $link->topicCoverages()
            ->where('status', TopicCoverageStatus::Covered)
            ->whereDoesntHave('canonicalTopic.verificationAttempts', fn ($q) => $q
                ->where('parent_child_link_id', $link->id)
                ->where('overall_result', VerificationResult::Understood)
            )
            ->count();

        return [
            'child_name' => $childUser->name,
            'exam_name' => $countdown->exam_name,
            'exam_date' => $countdown->exam_date->toDateString(),
            'days_remaining' => $daysRemaining,
            'urgency' => $urgency,
            'readiness_score' => $readinessCache ? (float) $readinessCache->composite_score : null,
            'study_time_today_minutes' => (int) round($todaySessions->sum('total_time_seconds') / 60),
            'questions_today' => $todaySessions->sum('question_count'),
            'accuracy_today' => round((float) ($todaySessions->avg('score_percentage') ?? 0), 2),
            'unverified_topic_count' => $unverifiedCount,
        ];
    }

    /** @return Collection<int, ExamCountdown> */
    public function getAlertEligibleExams(): Collection
    {
        return ExamCountdown::query()
            ->where('is_active', true)
            ->where('exam_date', '>=', now()->toDateString())
            ->get()
            ->filter(fn (ExamCountdown $countdown) => $this->shouldSendAlertToday($countdown));
    }

    public function shouldSendAlertToday(ExamCountdown $countdown): bool
    {
        $daysRemaining = (int) now()->startOfDay()->diffInDays($countdown->exam_date->startOfDay(), false);

        if ($daysRemaining < 0) {
            return false;
        }

        if ($daysRemaining > $countdown->alert_start_days_before) {
            return false;
        }

        if ($daysRemaining === 0) {
            return true;
        }

        if ($daysRemaining <= 7) {
            return true;
        }

        return $daysRemaining % 2 === 0;
    }
}
