<?php

namespace App\Services\Student;

use App\Models\BlockCompletion;
use App\Models\PracticeAnswer;
use App\Models\PracticeSession;
use App\Models\StudentProfile;
use App\Models\User;

class StudentStatsService
{
    public function getOverallAccuracy(User $user): int
    {
        $stats = PracticeAnswer::query()
            ->whereHas('practiceSession', fn ($q) => $q->where('user_id', $user->id))
            ->whereNotNull('is_correct')
            ->selectRaw('count(*) as total, sum(case when is_correct = true then 1 else 0 end) as correct')
            ->first();

        if (! $stats || $stats->total === 0) {
            return 0;
        }

        return (int) round($stats->correct / $stats->total * 100);
    }

    public function getStreakDays(User $user): int
    {
        $activeDates = PracticeSession::query()
            ->where('user_id', $user->id)
            ->whereNotNull('completed_at')
            ->selectRaw('completed_at::date as active_date')
            ->distinct()
            ->orderByDesc('active_date')
            ->limit(90)
            ->pluck('active_date')
            ->map(fn ($d) => (string) $d);

        if ($activeDates->isEmpty()) {
            return 0;
        }

        $streak = 0;
        $checkDate = today();

        if ($activeDates->first() !== $checkDate->toDateString()) {
            $checkDate = today()->subDay();
            if ($activeDates->first() !== $checkDate->toDateString()) {
                return 0;
            }
        }

        foreach ($activeDates as $date) {
            if ($date === $checkDate->toDateString()) {
                $streak++;
                $checkDate = $checkDate->subDay();
            } else {
                break;
            }
        }

        return $streak;
    }

    /** @return array{type: string, label: string, url: string}|null */
    public function getContinueStudying(User $user): ?array
    {
        $lastSession = PracticeSession::query()->where('user_id', $user->id)
            ->where('is_resumable', true)
            ->whereNull('completed_at')
            ->latest('last_activity_at')
            ->with('institutionCourse:id,course_code')
            ->first();

        $lastBlock = BlockCompletion::query()->where('user_id', $user->id)
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
    public function getLevelProgression(StudentProfile $profile): ?array
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

    public function getPracticeCount(User $user): int
    {
        return PracticeSession::query()
            ->where('user_id', $user->id)
            ->whereNotNull('completed_at')
            ->count();
    }

    public function getStudyHours(User $user): float
    {
        return round(
            (float) PracticeSession::query()
                ->where('user_id', $user->id)
                ->whereNotNull('completed_at')
                ->sum('total_time_seconds') / 3600,
            1
        );
    }

    public function getQuestionsPracticed(User $user): int
    {
        return PracticeAnswer::query()
            ->whereHas('practiceSession', fn ($q) => $q->where('user_id', $user->id))
            ->count();
    }
}
