<?php

namespace App\Services;

use App\Enums\ParentChildLinkStatus;
use App\Models\ParentChildLink;
use App\Models\ParentProfile;

class ParentSettingsService
{
    /** @return array{notification_preferences: array, children_settings: array<int, array>} */
    public function getSettings(ParentProfile $parentProfile): array
    {
        $links = ParentChildLink::query()
            ->where('parent_profile_id', $parentProfile->id)
            ->where('status', ParentChildLinkStatus::Active)
            ->with('studentProfile.user')
            ->get();

        return [
            'notification_preferences' => $parentProfile->notification_preferences ?? [],
            'children_settings' => $links->map(fn (ParentChildLink $link) => [
                'link_id' => $link->id,
                'child_name' => $link->studentProfile?->user?->name,
                'study_goal_minutes' => $link->study_goal_minutes,
                'current_term' => $link->current_term?->value,
                'term_start_date' => $link->term_start_date?->toDateString(),
            ])->all(),
        ];
    }

    /** @param array<string, mixed> $preferences */
    public function updateNotificationPreferences(ParentProfile $parentProfile, array $preferences): ParentProfile
    {
        $parentProfile->update([
            'notification_preferences' => $preferences,
        ]);

        return $parentProfile->fresh();
    }

    public function updateChildStudyDuration(ParentProfile $parentProfile, string $parentChildLinkId, int $minutes): ParentChildLink
    {
        $link = ParentChildLink::query()
            ->where('id', $parentChildLinkId)
            ->where('parent_profile_id', $parentProfile->id)
            ->firstOrFail();

        $link->update([
            'study_goal_minutes' => $minutes,
        ]);

        return $link->fresh();
    }
}
