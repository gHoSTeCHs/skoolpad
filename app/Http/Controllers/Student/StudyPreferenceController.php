<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class StudyPreferenceController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'daily_goal_minutes' => ['required', 'integer', 'in:15,30,45,60'],
        ]);

        $profile = $request->user()->studentProfile;

        $preferences = $profile->study_preferences ?? [];
        $preferences['daily_goal_minutes'] = $validated['daily_goal_minutes'];

        $profile->update(['study_preferences' => $preferences]);

        return back();
    }
}
