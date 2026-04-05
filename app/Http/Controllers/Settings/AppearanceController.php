<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateAppearanceRequest;
use Inertia\Inertia;
use Inertia\Response;

class AppearanceController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('settings/appearance');
    }

    public function update(UpdateAppearanceRequest $request)
    {
        $validated = $request->validated();

        $request->user()->preference()->updateOrCreate(
            ['user_id' => $request->user()->id],
            ['appearance' => $validated['appearance']],
        );

        return back()->withCookie(
            cookie('appearance', $validated['appearance'], 525600, '/', null, false, false, false, 'Lax')
        );
    }
}
