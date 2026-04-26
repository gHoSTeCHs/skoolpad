<?php

use App\ContentStudio\Adapters\AnthropicAdapter;
use App\ContentStudio\Adapters\OpenAICompatibleAdapter;
use App\ContentStudio\Prompts\ContentPromptTemplate;
use App\DataTransferObjects\ContentPrompt;
use App\DataTransferObjects\ContentResponse;
use App\Models\AIModel;
use App\Models\ContentProject;
use App\Models\PlatformSetting;
use App\Services\ContentGenerationService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('resolves the correct adapter for openai_compatible models', function () {
    $model = AIModel::factory()->create();
    $service = new ContentGenerationService;

    $adapter = $service->resolveAdapter($model);

    expect($adapter)->toBeInstanceOf(OpenAICompatibleAdapter::class);
});

it('resolves the correct adapter for anthropic models', function () {
    $model = AIModel::factory()->anthropic()->create();
    $service = new ContentGenerationService;

    $adapter = $service->resolveAdapter($model);

    expect($adapter)->toBeInstanceOf(AnthropicAdapter::class);
});

it('resolves model by explicit ID', function () {
    $model = AIModel::factory()->create(['name' => 'Target Model']);
    AIModel::factory()->create(['name' => 'Other Model']);

    $service = new ContentGenerationService;
    $resolved = $service->resolveModel($model->id);

    expect($resolved->id)->toBe($model->id);
});

it('resolves model by task routing', function () {
    $model = AIModel::factory()->create(['name' => 'Routed Model']);

    PlatformSetting::query()->create([
        'key' => 'ai_task_routing',
        'value' => ['scheme' => $model->id, 'blocks' => $model->id],
    ]);

    $service = new ContentGenerationService;
    $resolved = $service->resolveModel(null, 'scheme');

    expect($resolved->id)->toBe($model->id);
});

it('resolves model from project stage override when project and stage provided', function () {
    $stageModel = AIModel::factory()->create(['name' => 'Stage Override']);
    $projectDefault = AIModel::factory()->create(['name' => 'Project Default']);
    $platformDefault = AIModel::factory()->create(['name' => 'Platform Default']);

    $project = ContentProject::factory()->create([
        'scheme_model_id' => $stageModel->id,
        'default_ai_model_id' => $projectDefault->id,
    ]);

    PlatformSetting::query()->create([
        'key' => 'content_studio.default_model_id',
        'value' => ['model_id' => $platformDefault->id],
    ]);

    $service = new ContentGenerationService;
    $resolved = $service->resolveModel(null, 'scheme', $project);

    expect($resolved->id)->toBe($stageModel->id);
});

it('falls back to project default when stage override not set', function () {
    $projectDefault = AIModel::factory()->create(['name' => 'Project Default']);
    $platformDefault = AIModel::factory()->create(['name' => 'Platform Default']);

    $project = ContentProject::factory()->create([
        'default_ai_model_id' => $projectDefault->id,
    ]);

    PlatformSetting::query()->create([
        'key' => 'content_studio.default_model_id',
        'value' => ['model_id' => $platformDefault->id],
    ]);

    $service = new ContentGenerationService;
    $resolved = $service->resolveModel(null, 'scheme', $project);

    expect($resolved->id)->toBe($projectDefault->id);
});

it('prefers explicit request override over all project and platform defaults', function () {
    $override = AIModel::factory()->create(['name' => 'Request Override']);
    $stageModel = AIModel::factory()->create(['name' => 'Stage']);
    $projectDefault = AIModel::factory()->create(['name' => 'Project Default']);

    $project = ContentProject::factory()->create([
        'scheme_model_id' => $stageModel->id,
        'default_ai_model_id' => $projectDefault->id,
    ]);

    $service = new ContentGenerationService;
    $resolved = $service->resolveModel($override->id, 'scheme', $project);

    expect($resolved->id)->toBe($override->id);
});

it('skips inactive project stage model and falls through', function () {
    $inactive = AIModel::factory()->inactive()->create();
    $projectDefault = AIModel::factory()->create(['name' => 'Project Default']);

    $project = ContentProject::factory()->create([
        'scheme_model_id' => $inactive->id,
        'default_ai_model_id' => $projectDefault->id,
    ]);

    $service = new ContentGenerationService;
    $resolved = $service->resolveModel(null, 'scheme', $project);

    expect($resolved->id)->toBe($projectDefault->id);
});

it('resolves model from platform default when no routing matches', function () {
    AIModel::factory()->create(['sort_order' => 1, 'name' => 'First']);
    $platformDefault = AIModel::factory()->create(['sort_order' => 5, 'name' => 'Platform Default']);

    PlatformSetting::query()->create([
        'key' => 'content_studio.default_model_id',
        'value' => ['model_id' => $platformDefault->id],
    ]);

    $service = new ContentGenerationService;
    $resolved = $service->resolveModel();

    expect($resolved->id)->toBe($platformDefault->id);
});

it('prefers task routing over platform default', function () {
    $routed = AIModel::factory()->create(['name' => 'Routed']);
    $platformDefault = AIModel::factory()->create(['name' => 'Platform Default']);

    PlatformSetting::query()->create([
        'key' => 'ai_task_routing',
        'value' => ['scheme' => $routed->id],
    ]);

    PlatformSetting::query()->create([
        'key' => 'content_studio.default_model_id',
        'value' => ['model_id' => $platformDefault->id],
    ]);

    $service = new ContentGenerationService;
    $resolved = $service->resolveModel(null, 'scheme');

    expect($resolved->id)->toBe($routed->id);
});

it('falls back to platform default when task routing has no match for stage', function () {
    $platformDefault = AIModel::factory()->create(['name' => 'Platform Default']);
    $other = AIModel::factory()->create(['name' => 'Other']);

    PlatformSetting::query()->create([
        'key' => 'ai_task_routing',
        'value' => ['research' => $other->id],
    ]);

    PlatformSetting::query()->create([
        'key' => 'content_studio.default_model_id',
        'value' => ['model_id' => $platformDefault->id],
    ]);

    $service = new ContentGenerationService;
    $resolved = $service->resolveModel(null, 'scheme');

    expect($resolved->id)->toBe($platformDefault->id);
});

it('falls back to first active model when no routing exists', function () {
    $first = AIModel::factory()->create(['sort_order' => 1, 'name' => 'First']);
    AIModel::factory()->create(['sort_order' => 2, 'name' => 'Second']);

    $service = new ContentGenerationService;
    $resolved = $service->resolveModel();

    expect($resolved->id)->toBe($first->id);
});

it('skips inactive platform default and falls through to sort order', function () {
    $inactive = AIModel::factory()->inactive()->create(['name' => 'Inactive Default']);
    $active = AIModel::factory()->create(['sort_order' => 1, 'name' => 'Active First']);

    PlatformSetting::query()->create([
        'key' => 'content_studio.default_model_id',
        'value' => ['model_id' => $inactive->id],
    ]);

    $service = new ContentGenerationService;
    $resolved = $service->resolveModel();

    expect($resolved->id)->toBe($active->id);
});

it('skips inactive models in fallback', function () {
    AIModel::factory()->inactive()->create(['sort_order' => 1, 'name' => 'Inactive']);
    $active = AIModel::factory()->create(['sort_order' => 2, 'name' => 'Active']);

    $service = new ContentGenerationService;
    $resolved = $service->resolveModel();

    expect($resolved->id)->toBe($active->id);
});

it('throws when no active models exist', function () {
    $service = new ContentGenerationService;

    expect(fn () => $service->resolveModel())
        ->toThrow(RuntimeException::class, 'No active AI models configured');
});

it('creates a valid ContentPrompt from template', function () {
    $template = new class extends ContentPromptTemplate
    {
        public function promptType(): string
        {
            return 'P-01';
        }

        public function systemPrompt(): string
        {
            return 'System prompt here.';
        }

        public function userPrompt(array $context): string
        {
            return "Parse curriculum for {$context['subject']}.";
        }

        public function jsonSchema(): array
        {
            return ['subject' => ['required', 'string']];
        }

        public function temperature(): float
        {
            return 0.3;
        }
    };

    $prompt = $template->build(['subject' => 'Physics']);

    expect($prompt)
        ->toBeInstanceOf(ContentPrompt::class)
        ->system_prompt->toBe('System prompt here.')
        ->user_prompt->toBe('Parse curriculum for Physics.')
        ->temperature->toBe(0.3)
        ->expected_format->toBe('json')
        ->context->toBe(['subject' => 'Physics']);
});

it('creates a ContentResponse with split token counts', function () {
    $response = new ContentResponse(
        valid: true,
        data: ['topics' => []],
        raw_response: '{"topics":[]}',
        model_used: 'deepseek-chat',
        tokens_used: 350,
        generation_time_ms: 1200.5,
        input_tokens: 200,
        output_tokens: 150,
    );

    expect($response)
        ->valid->toBeTrue()
        ->tokens_used->toBe(350)
        ->input_tokens->toBe(200)
        ->output_tokens->toBe(150);
});

it('defaults split tokens to zero for backward compatibility', function () {
    $response = new ContentResponse(
        valid: true,
        data: [],
        raw_response: '',
        model_used: 'test',
        tokens_used: 100,
    );

    expect($response)
        ->input_tokens->toBe(0)
        ->output_tokens->toBe(0);
});
