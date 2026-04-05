<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdatePlatformSettingRequest;
use App\Models\PlatformSetting;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function index(): Response
    {
        $settings = PlatformSetting::query()->get()
            ->mapWithKeys(fn (PlatformSetting $s) => [$s->key => $s->value]);

        return Inertia::render('admin/settings/index', [
            'settings' => $settings,
        ]);
    }

    public function update(UpdatePlatformSettingRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        if (! $request->user()->role->hasPermission('manage_platform_settings')) {
            abort(403, 'You do not have permission to manage platform settings.');
        }

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
