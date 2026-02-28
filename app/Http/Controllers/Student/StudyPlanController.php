<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class StudyPlanController extends Controller
{
    public function dismiss(Request $request): RedirectResponse
    {
        $profile = $request->user()->studentProfile;
        $preferences = $profile->study_preferences ?? [];
        $preferences['plan_dismissed_date'] = now()->toDateString();
        $profile->update(['study_preferences' => $preferences]);

        return back();
    }
}
