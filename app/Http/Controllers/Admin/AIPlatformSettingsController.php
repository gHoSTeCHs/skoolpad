<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateAIPlatformSettingsRequest;
use App\Models\AIModel;
use App\Models\PlatformSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class AIPlatformSettingsController extends Controller
{
    private const DEFAULT_KEY = 'content_studio.default_model_id';

    public function edit(): Response
    {
        Gate::authorize('viewSettings', PlatformSetting::class);

        $aiModels = AIModel::query()
            ->with('provider:id,adapter_type')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'provider_id', 'name', 'model_id', 'is_active', 'input_cost_per_million', 'output_cost_per_million']);

        $defaultValue = PlatformSetting::query()
            ->where('key', self::DEFAULT_KEY)
            ->value('value');

        $defaultModelId = is_array($defaultValue) ? ($defaultValue['model_id'] ?? null) : null;

        return Inertia::render('admin/settings/ai', [
            'aiModels' => $aiModels->map(fn (AIModel $m) => [
                'id' => $m->id,
                'name' => $m->name,
                'model_id' => $m->model_id,
                'adapter_type' => $m->provider->adapter_type->value,
                'adapter_type_label' => $m->provider->adapter_type->label(),
                'is_active' => $m->is_active,
                'input_cost_per_million' => (float) $m->input_cost_per_million,
                'output_cost_per_million' => (float) $m->output_cost_per_million,
            ]),
            'defaultModelId' => $defaultModelId,
        ]);
    }

    public function update(UpdateAIPlatformSettingsRequest $request): RedirectResponse
    {
        Gate::authorize('updateSettings', PlatformSetting::class);

        $modelId = $request->validated('default_model_id');

        PlatformSetting::query()->updateOrCreate(
            ['key' => self::DEFAULT_KEY],
            [
                'value' => $modelId ? ['model_id' => $modelId] : [],
                'updated_by' => $request->user()->id,
            ],
        );

        return back()->with('success', 'Platform default model updated.');
    }
}
