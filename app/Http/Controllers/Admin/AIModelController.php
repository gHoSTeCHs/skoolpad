<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\Paginates;
use App\Enums\AIAdapterType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAIModelRequest;
use App\Http\Requests\Admin\UpdateAIModelRequest;
use App\Models\AIModel;
use App\Services\ContentGenerationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

        $models = AIModel::query()
            ->with('provider')
            ->when($request->filled('search'), fn ($q) => $q->search($request->string('search')))
            ->orderByRaw('(SELECT sort_order FROM ai_providers WHERE ai_providers.id = ai_models.provider_id)')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate(self::DEFAULT_PER_PAGE)
            ->withQueryString();

        $modelsWithLabels = $models->through(fn (AIModel $model) => array_merge(
            $model->toArray(),
            [
                'provider' => $model->provider?->toArray(),
                'provider_api_key_set' => ! empty($model->provider?->api_key),
            ]
        ));

        return Inertia::render('admin/ai-models/index', [
            'models' => $this->paginated($modelsWithLabels),
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

        AIModel::query()->create($data);

        return to_route('admin.ai-models.index')
            ->with('success', 'AI model added successfully.');
    }

    public function edit(AIModel $aiModel): Response
    {
        Gate::authorize('update', $aiModel);

        $aiModel->loadMissing('provider');
        $data = $aiModel->toArray();
        $data['provider'] = $aiModel->provider?->toArray();
        $data['provider_api_key_set'] = ! empty($aiModel->provider?->api_key);

        return Inertia::render('admin/ai-models/edit', [
            'aiModel' => $data,
            'adapterTypes' => AIAdapterType::toSelectOptions(),
        ]);
    }

    public function update(UpdateAIModelRequest $request, AIModel $aiModel): RedirectResponse
    {
        Gate::authorize('update', $aiModel);

        $data = $request->validated();

        if (isset($data['api_key']) && $data['api_key'] === self::API_KEY_MASK) {
            unset($data['api_key']);
        }

        if (array_key_exists('api_key', $data) && empty($data['api_key'])) {
            $data['api_key'] = null;
        }

        $aiModel->update($data);

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
