<?php

namespace App\Services;

use App\Enums\ParentChildLinkStatus;
use App\Models\PracticeSession;
use App\Models\StudentProfile;
use App\Models\User;
use App\Models\UserLevel;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ParentEngagementService
{
    /**
     * @return array{show: bool, style: string, is_early_level: bool, trigger: string}|null
     */
    public function shouldShowInvitePrompt(User $user, StudentProfile $profile): ?array
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

        $isEarlyLevel = $level->sort_order <= 2;

        if ($profile->parent_invite_dismissed_at) {
            if (! $isEarlyLevel) {
                return null;
            }

            if ($profile->parent_invite_dismissed_at->diffInDays(now()) < 7) {
                return null;
            }
        }

        $hasParentLink = $profile->parentChildLinks()
            ->whereIn('status', [ParentChildLinkStatus::Pending, ParentChildLinkStatus::Active])
            ->exists();

        if ($hasParentLink) {
            return null;
        }

        $trigger = $this->detectTrigger($user);

        if (! $trigger) {
            return null;
        }

        return [
            'show' => true,
            'style' => $isEarlyLevel ? 'prominent' : 'subtle',
            'is_early_level' => $isEarlyLevel,
            'trigger' => $trigger,
        ];
    }

    private function detectTrigger(User $user): ?string
    {
        $recentSession = PracticeSession::query()
            ->where('user_id', $user->id)
            ->whereNotNull('completed_at')
            ->latest('completed_at')
            ->first();

        $stats = null;

        if ($recentSession) {
            $stats = DB::table('practice_sessions')
                ->where('user_id', $user->id)
                ->whereNotNull('completed_at')
                ->selectRaw(
                    'COUNT(*) as total_count, COUNT(*) FILTER (WHERE completed_at >= ?) as recent_week_count, MIN(completed_at) as first_completed_at',
                    [now()->subWeek()]
                )
                ->first();

            if ((int) $stats->total_count === 1 && $recentSession->score_percentage >= 60) {
                return 'first_practice_above_60';
            }

            if ($recentSession->score_percentage >= 80) {
                return 'high_score';
            }
        }

        $userLevel = UserLevel::query()
            ->where('user_id', $user->id)
            ->first();

        if ($userLevel && $userLevel->streak_days >= 3) {
            return 'three_day_streak';
        }

        if ($stats) {
            $firstCompletedAt = $stats->first_completed_at
                ? Carbon::parse($stats->first_completed_at)
                : null;

            if ($firstCompletedAt && $firstCompletedAt->diffInDays(now()) >= 7 && (int) $stats->recent_week_count >= 3) {
                return 'consistent_first_week';
            }
        }

        return null;
    }
}
