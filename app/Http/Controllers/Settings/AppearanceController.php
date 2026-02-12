<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AppearanceController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('settings/appearance');
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'appearance' => ['required', Rule::in(['light', 'dark', 'reader', 'system'])],
        ]);

        $request->user()->preference()->updateOrCreate(
            ['user_id' => $request->user()->id],
            ['appearance' => $validated['appearance']],
        );

        return back()->withCookie(
            cookie('appearance', $validated['appearance'], 525600, '/', null, false, false, false, 'Lax')
        );
    }
}
