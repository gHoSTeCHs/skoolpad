<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\UpdateLevelProgressionRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LevelProgressionController extends Controller
{
    public function check(Request $request): JsonResponse
    {
        $profile = $request->user()->studentProfile;

        if (! $profile || $profile->isTertiary() || ! $profile->education_level_id) {
            return response()->json(['show_prompt' => false]);
        }

        $nextLevel = $profile->findNextLevel();
        if (! $nextLevel) {
            return response()->json(['show_prompt' => false]);
        }

        $month = (int) now()->format('n');
        $day = (int) now()->format('j');
        $isTransitionPeriod = ($month === 1 && $day <= 14)
            || ($month === 4 && $day <= 14)
            || ($month === 9 && $day <= 14);

        if (! $isTransitionPeriod) {
            return response()->json(['show_prompt' => false]);
        }

        $currentLevel = $profile->educationLevel;

        return response()->json([
            'show_prompt' => true,
            'current_level' => $currentLevel->display_name ?? $currentLevel->name,
            'next_level' => $nextLevel->display_name ?? $nextLevel->name,
            'next_level_id' => $nextLevel->id,
        ]);
    }

    public function update(UpdateLevelProgressionRequest $request): RedirectResponse
    {
        $profile = $request->user()->studentProfile;
        $profile->update([
            'education_level_id' => $request->validated('education_level_id'),
        ]);

        return redirect()->route('dashboard');
    }
}
