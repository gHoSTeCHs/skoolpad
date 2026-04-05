<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdatePlatformSettingRequest;
use App\Models\PlatformSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function index(): Response
    {
        Gate::authorize('viewSettings', PlatformSetting::class);

        $settings = PlatformSetting::query()->get()
            ->mapWithKeys(fn (PlatformSetting $s) => [$s->key => $s->value]);

        return Inertia::render('admin/settings/index', [
            'settings' => $settings,
        ]);
    }

    public function update(UpdatePlatformSettingRequest $request): RedirectResponse
    {
        Gate::authorize('updateSettings', PlatformSetting::class);

        $validated = $request->validated();

        if ($validated['key'] === 'monetization_enabled' && ! $request->user()->role->hasPermission('toggle_monetization')) {
            abort(403, 'You do not have permission to toggle monetization.');
        }

        $setting = PlatformSetting::query()->where('key', $validated['key'])->firstOrFail();
        $setting->update([
            'value' => $validated['value'],
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Setting updated successfully.');
    }
}
