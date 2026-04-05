<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\UpdateStudyPreferenceRequest;
use Illuminate\Http\RedirectResponse;

class StudyPreferenceController extends Controller
{
    public function __invoke(UpdateStudyPreferenceRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $profile = $request->user()->studentProfile;

        $preferences = $profile->study_preferences ?? [];
        $preferences['daily_goal_minutes'] = $validated['daily_goal_minutes'];

        $profile->update(['study_preferences' => $preferences]);

        return back();
    }
}
