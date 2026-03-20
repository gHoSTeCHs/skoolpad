<?php

namespace App\Http\Controllers\ParentDashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\ParentDashboard\UpdateChildStudyDurationRequest;
use App\Http\Requests\ParentDashboard\UpdateNotificationPreferencesRequest;
use App\Models\ParentChildLink;
use App\Services\ParentSettingsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ParentSettingsController extends Controller
{
    public function __construct(
        private readonly ParentSettingsService $settingsService,
    ) {}

    public function index(Request $request): Response
    {
        $parentProfile = $request->user()->parentProfile;
        $settings = $this->settingsService->getSettings($parentProfile);

        return Inertia::render('parent/settings', $settings);
    }

    public function updateNotifications(UpdateNotificationPreferencesRequest $request): RedirectResponse
    {
        $parentProfile = $request->user()->parentProfile;

        $this->settingsService->updateNotificationPreferences(
            parentProfile: $parentProfile,
            preferences: $request->validated(),
        );

        return redirect()->back();
    }

    public function updateStudyDuration(UpdateChildStudyDurationRequest $request, ParentChildLink $link): RedirectResponse
    {
        $parentProfile = $request->user()->parentProfile;

        $this->settingsService->updateChildStudyDuration(
            parentProfile: $parentProfile,
            parentChildLinkId: $link->id,
            minutes: (int) $request->validated('study_goal_minutes'),
        );

        return redirect()->back();
    }
}
