<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\Paginates;
use App\Enums\AIAdapterType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAIModelRequest;
use App\Http\Requests\Admin\UpdateAIModelRequest;
use App\Models\AIModel;
use App\Models\AIProvider;
use App\Services\ContentGenerationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AIModelController extends Controller
{
    use Paginates;

    private const API_KEY_MASK = '••••••••';

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', AIModel::class);

        $search = $request->string('search');

        $providers = AIProvider::query()
            ->with(['aiModels' => function ($q) use ($search) {
                $q->orderBy('sort_order')->orderBy('name');
                if ($search->isNotEmpty()) {
                    $q->search($search);
                }
            }])
            ->orderBy('sort_order')
            ->get()
            ->map(fn (AIProvider $provider) => array_merge(
                $provider->toArray(),
                [
                    'adapter_type_label' => $provider->adapter_type->label(),
                    'api_key_set' => ! empty($provider->api_key),
                    'models' => $provider->aiModels->map(fn (AIModel $model) => array_merge(
                        $model->toArray(),
                        ['provider_api_key_set' => ! empty($provider->api_key)],
                    ))->values()->all(),
                ],
            ))
            ->values();

        return Inertia::render('admin/ai-models/index', [
            'providers' => $providers,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', AIModel::class);

        return Inertia::render('admin/ai-models/create', [
            'adapterTypes' => AIAdapterType::toSelectOptions(),
        ]);
    }

    public function store(StoreAIModelRequest $request): RedirectResponse
    {
        Gate::authorize('create', AIModel::class);

        $data = $request->validated();

        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        DB::transaction(function () use ($data) {
            $provider = $this->resolveOrCreateProvider($data);

            AIModel::query()->create([
                'provider_id' => $provider->id,
                'name' => $data['name'],
                'slug' => $data['slug'],
                'model_id' => $data['model_id'],
                'thinking_mode' => $data['thinking_mode'] ?? 'none',
                'max_tokens' => $data['max_tokens'],
                'input_cost_per_million' => $data['input_cost_per_million'],
                'output_cost_per_million' => $data['output_cost_per_million'],
                'is_active' => $data['is_active'] ?? true,
                'sort_order' => $data['sort_order'] ?? 0,
            ]);
        });

        return to_route('admin.ai-models.index')
            ->with('success', 'AI model added successfully.');
    }

    public function edit(AIModel $aiModel): Response
    {
        Gate::authorize('update', $aiModel);

        $aiModel->loadMissing('provider');
        $data = $aiModel->toArray();
        $provider = $aiModel->provider;
        $data['adapter_type'] = $provider?->adapter_type->value;
        $data['base_url'] = $provider?->base_url;
        $data['api_key'] = ! empty($provider?->api_key) ? self::API_KEY_MASK : null;
        $data['provider_api_key_set'] = ! empty($provider?->api_key);

        return Inertia::render('admin/ai-models/edit', [
            'aiModel' => $data,
            'adapterTypes' => AIAdapterType::toSelectOptions(),
        ]);
    }

    public function update(UpdateAIModelRequest $request, AIModel $aiModel): RedirectResponse
    {
        Gate::authorize('update', $aiModel);

        $data = $request->validated();

        DB::transaction(function () use ($aiModel, $data) {
            $apiKey = $data['api_key'] ?? null;
            $keepExistingKey = $apiKey === self::API_KEY_MASK;

            $aiModel->loadMissing('provider');
            $provider = $aiModel->provider;

            if ($provider) {
                $providerUpdates = [
                    'adapter_type' => $data['adapter_type'],
                    'base_url' => rtrim($data['base_url'], '/'),
                ];
                if (! $keepExistingKey) {
                    $providerUpdates['api_key'] = empty($apiKey) ? null : $apiKey;
                }
                $provider->update($providerUpdates);
            }

            $aiModel->update([
                'name' => $data['name'],
                'slug' => $data['slug'],
                'model_id' => $data['model_id'],
                'thinking_mode' => $data['thinking_mode'] ?? 'none',
                'max_tokens' => $data['max_tokens'],
                'input_cost_per_million' => $data['input_cost_per_million'],
                'output_cost_per_million' => $data['output_cost_per_million'],
                'is_active' => $data['is_active'] ?? $aiModel->is_active,
                'sort_order' => $data['sort_order'] ?? $aiModel->sort_order,
            ]);
        });

        return to_route('admin.ai-models.index')
            ->with('success', 'AI model updated successfully.');
    }

    public function destroy(AIModel $aiModel): RedirectResponse
    {
        Gate::authorize('delete', $aiModel);

        $aiModel->delete();

        return to_route('admin.ai-models.index')
            ->with('success', 'AI model deleted.');
    }

    private function resolveOrCreateProvider(array $data): AIProvider
    {
        $baseUrl = rtrim($data['base_url'], '/');

        $provider = AIProvider::query()
            ->where('adapter_type', $data['adapter_type'])
            ->where('base_url', $baseUrl)
            ->first();

        if ($provider) {
            if (! empty($data['api_key'])) {
                $provider->update(['api_key' => $data['api_key']]);
                $provider->refresh();
            }

            return $provider;
        }

        $host = parse_url($baseUrl, PHP_URL_HOST) ?? 'unknown';
        $baseSlug = Str::slug($host);
        $slug = $baseSlug;
        $suffix = 2;
        while (AIProvider::query()->where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$suffix}";
            $suffix++;
        }

        return AIProvider::query()->create([
            'name' => ucwords(str_replace(['-', '.'], ' ', $host)),
            'slug' => $slug,
            'adapter_type' => $data['adapter_type'],
            'base_url' => $baseUrl,
            'api_key' => $data['api_key'] ?? null,
            'supports_thinking' => false,
            'is_active' => true,
            'sort_order' => 99,
        ]);
    }

    public function testConnection(AIModel $aiModel, ContentGenerationService $service): JsonResponse
    {
        Gate::authorize('update', $aiModel);

        $adapter = $service->resolveAdapter($aiModel);

        $prompt = new \App\DataTransferObjects\ContentPrompt(
            system_prompt: 'You are a test assistant. Respond with exactly: OK',
            user_prompt: 'Say OK.',
            temperature: 0.0,
            max_tokens: 10,
        );

        $response = $adapter->generate($prompt);

        if ($response->valid || ! empty($response->raw_response)) {
            return response()->json([
                'success' => true,
                'model_used' => $response->model_used,
                'tokens_used' => $response->tokens_used,
                'generation_time_ms' => round($response->generation_time_ms),
            ]);
        }

        return response()->json([
            'success' => false,
            'errors' => $response->validation_errors,
        ], 422);
    }
}
